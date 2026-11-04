---
title: "Tuning actions-runner-controller: Flag Ratios and Concurrency Profiles"
date: "2026-11-04"
description: "How ARC's four reconcile-concurrency flags, the Kubernetes client rate limiter and the workqueue limiter fit together, with sizing profiles from small to XL."
tags: [kubernetes, github-actions, arc, devops]
---

[actions-runner-controller](https://github.com/actions/actions-runner-controller) (ARC) runs GitHub Actions jobs on your own Kubernetes cluster. Out of the box it is tuned for a handful of runner scale sets and a modest stream of jobs. Push it harder and you find a set of flags in `main.go` that decide how much work the controller does at once, and how hard it may lean on the Kubernetes API server and on GitHub while doing it.

The flags are easy to raise one at a time and hard to raise *together*. This post is the set of ratios I use to keep them in proportion, and four sizing profiles to start from.

Everything here comes from reading my fork, [darkmastermindz/actions-runner-controller](https://github.com/darkmastermindz/actions-runner-controller) (a fork of [actions/actions-runner-controller](https://github.com/actions/actions-runner-controller)):

- [`main.go` lines 129-171](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/main.go#L129-L171): the flags
- [`main.go` lines 243-245](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/main.go#L243-L245): where the client QPS and burst are applied
- [`controllers/actions.github.com/options.go` lines 45-52](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/controllers/actions.github.com/options.go#L45-L52): the shipped defaults
- [`controllers/actions.github.com/options.go` lines 87-99](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/controllers/actions.github.com/options.go#L87-L99): the workqueue rate limiter notes

The background discussion lives upstream in [actions/actions-runner-controller#3021](https://github.com/actions/actions-runner-controller/issues/3021).

## The four concurrency flags

ARC's scale set mode runs four controllers, and each gets its own "max concurrent reconciles" flag: the number of workers pulling from that controller's queue at the same time.

| Flag | Controller | Default | One object per… | Typical count |
| --- | --- | --- | --- | --- |
| `--autoscaling-runner-set-max-concurrent-reconciles` | AutoscalingRunnerSet | 2 | scale set | number of scale sets |
| `--autoscaling-listener-max-concurrent-reconciles` | AutoscalingListener | 2 | scale set | number of scale sets |
| `--ephemeral-runner-set-max-concurrent-reconciles` | EphemeralRunnerSet | 2 | scale set | number of scale sets |
| `--ephemeral-runner-max-concurrent-reconciles` | EphemeralRunner | 4 | runner | hundreds, at peak |

The detail that makes these flags make sense: **controller-runtime never reconciles the same object twice at once.** Its workqueue hands each object key to one worker at a time, and if the object changes mid-reconcile, the key is queued again for after that worker finishes. So the parallelism you actually get is:

```text
effective parallelism = min(flag, number of distinct objects with pending work)
```

That is why EphemeralRunner is the only controller with a higher default. It reconciles one object per runner, so a scale set with `maxRunners: 50` really can have 50 independent pieces of work in flight, each going create → running → finished → delete. The other three reconcile one object per *scale set*. With three scale sets, setting `--ephemeral-runner-set-max-concurrent-reconciles` to 16 still means at most three busy workers; the other thirteen sit idle.

Two more things to know before tuning:

- **Zero doesn't mean "off".** Any value of zero or less is swapped for the shipped default before it reaches controller-runtime, so you can't use 0 to disable a controller's concurrency.
- **The runner flag sizes a second pool.** `--ephemeral-runner-max-concurrent-reconciles` also sets the number of background workers that remove runner registrations from GitHub after a job ([`main.go` lines 364-368](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/main.go#L364-L368)). Raising it speeds up GitHub-side cleanup too, and adds GitHub calls in parallel.

## Sizing profiles

Four starting points. Small is the shipped defaults; each step up assumes more runner scale sets and more runners.

| Flag | Small (1-5 sets, under 50 runners) | Medium (10-30 sets, ~200 runners) | Large (50+ sets, 500+ runners) | XL (100+ sets, 1,000+ runners) |
| --- | --- | --- | --- | --- |
| `--ephemeral-runner-max-concurrent-reconciles` | 4 (default) | 8-10 | 16-32 | 64 |
| `--autoscaling-runner-set-max-concurrent-reconciles` | 2 (default) | 4-8 | 10-16 | 16-32 |
| `--ephemeral-runner-set-max-concurrent-reconciles` | 2 (default) | 2-4 | 4-8 | 8-16 |
| `--autoscaling-listener-max-concurrent-reconciles` | 2 (default) | 2 | 4 | 4-8 |
| `--k8s-client-rate-limiter-qps` | 20 (default) | 50 | 100-150 | 200+ |
| `--k8s-client-rate-limiter-burst` | 30 (default) | 100 | 200 | 300-400 |
| `--workqueue-rate-limiter` | `bucket_rate_limiter` (default) | `bucket_rate_limiter` | `typed_rate_limiter` | `typed_rate_limiter` |
| `--sync-period` | 1m (default) | 1m-5m | 5m | 5m-10m |
| `--default-scale-down-delay` | default | default | default, or +50% | tuned to the gap between job bursts |
| `--terminated-runner-pod-grace-period-seconds` | 0 (default) | 0 | 0 | 0 |
| `--watch-namespace` | all namespaces (default) | all | consider one namespace | one namespace per controller (shard) |

Notes on the rows that aren't about workers:

- **`--sync-period`**: how often every object the controller watches is reconciled again with nothing changed, as a safety net for missed events. Events still trigger a reconcile straight away; this is only the fallback. Longer means less background work at scale and slower recovery from a missed event.
- **`--default-scale-down-delay`**: the cool-down before scaling down after a scale-up, to stop flapping. Longer leaves idle runners around; shorter risks down → up → down loops when jobs arrive in bursts. It's read by the legacy (summerwind.net) HorizontalRunnerAutoscaler; in scale set mode the listener drives scaling.
- **`--terminated-runner-pod-grace-period-seconds`**: 0 removes a finished runner pod straight away so its replacement can start at once. A negative value hands over to the pod's own `terminationGracePeriodSeconds`.
- **`--watch-namespace`**: limits the controller's cache to one namespace, which cuts memory and the number of events it handles. At XL, splitting scale sets across namespaces with one controller each is a way to shard the load.

## The ratios

Raising one flag moves the bottleneck to the next one. These are the ratios that keep them in step.

### 1. Worker ratio: runner workers at 2-4x the set-level workers

Keep `--ephemeral-runner-max-concurrent-reconciles` at roughly **2-4x** the set-level controllers. Runners outnumber scale sets by a wide margin, so the runner controller is where work piles up first.

| Profile | ephemeral-runner | autoscaling-runner-set | ephemeral-runner-set | listener |
| --- | --- | --- | --- | --- |
| Default | 4 | 2 | 2 | 2 |
| Medium | 8 | 4 | 2 | 2 |
| Large | 16 | 8 | 4 | 4 |
| XL | 64 | 16 | 8 | 4 |

And the set-level flags should never go above your scale set count: past that, the extra workers have nothing to do.

### 2. Client QPS to workers: about two writes in flight per worker

The controller's Kubernetes client has its own rate limiter (`--k8s-client-rate-limiter-qps` and `--k8s-client-rate-limiter-burst`), applied once to the client config in [`main.go` lines 243-245](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/main.go#L243-L245). All four controllers share it.

The good news is that reads are free: `Get` and `List` are served from the informer cache, a local copy of the objects kept up to date by a watch, and never touch the client limiter. Only **writes** do: Create, Patch, Delete and status patches. For an EphemeralRunner that's about **1-4 writes per reconcile** (add the finalizer, create the registration secret, create the pod, patch status), and **6-10 writes over one runner's life** once cleanup (delete the pod and secret, remove the finalizer) is counted.

So:

- **QPS ≥ total workers × ~2** writes in flight.
- **Burst ≥ QPS**, and **burst ≥ your largest worker pool**, so a full pool waking up at once isn't throttled on its first write.

Worked through for the profiles, taking the top of each range:

| Profile | Total workers | × 2 | QPS / burst |
| --- | --- | --- | --- |
| Small | 4 + 2 + 2 + 2 = 10 | 20 | 20 / 30 |
| Medium | 10 + 8 + 4 + 2 = 24 | 48 | 50 / 100 |
| Large | 32 + 16 + 8 + 4 = 60 | 120 | 100-150 / 200 |
| XL | 64 + 32 + 16 + 8 = 120 | 240 | 200+ / 300-400 |

The limiter only protects the controller from itself. The API server is the real ceiling: 150 writes a second is meaningful load, so on a small or shared control plane check the API server's own request latency before going higher.

### 3. Workqueue limiter: `typed_rate_limiter` once you pass ~16 workers

The flag's help text and the [`options.go` notes](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/controllers/actions.github.com/options.go#L87-L99) describe the default as controller-runtime's limiter: per-item exponential backoff plus a token bucket of 10 adds per second (burst 100) shared by every item in a controller's queue. With a few workers you never notice that bucket. Above roughly **16 total workers**, a burst of new runners empties it and items wait for tokens while workers sit idle. `--workqueue-rate-limiter=typed_rate_limiter` removes the shared bucket and keeps per-item backoff, so one failing object still backs off on its own without slowing the rest.

One caveat from reading the code at this commit: when no limiter is passed, [`newControllerOptions` (`options.go` lines 115-130)](https://github.com/darkmastermindz/actions-runner-controller/blob/89f34c4f782d4b488e6aecb66146407fee8eb3af/controllers/actions.github.com/options.go#L115-L130) only uses that bucket if controller-runtime's priority queue is explicitly turned off. Otherwise the default is already per-item backoff only (5ms up to 30s), and every limiter is capped at a 30-second wait. So on current builds, `typed_rate_limiter` changes the backoff curve more than it removes a bottleneck. Set it at Large and above anyway (it makes the no-shared-bucket behaviour explicit, whatever the build), and treat the queue as a bottleneck only if `workqueue_depth` says so.

### 4. Sync period vs. scale-down delay

Where scale-down waits for a reconcile, the effective scale-down latency is about:

```text
scale-down latency ≈ max(scale-down-delay, sync-period)
```

If you raise `--sync-period` to cut background work at scale, raise `--default-scale-down-delay` with it, or the delay you configured is not the one you get.

### 5. GitHub's API budget

The Kubernetes side is only half of it. Runner registration (the just-in-time runner config) and removal call GitHub, and GitHub's limits don't move with your flags:

| Auth | Budget | Roughly |
| --- | --- | --- |
| Personal access token (PAT) | ~5,000 requests/hour | ~80 runner transitions/minute |
| GitHub App | up to ~15,000 requests/hour | ~250 runner transitions/minute |

Those per-minute figures assume about one GitHub call per transition; divide by however many your runners really make. 64 runner workers (and 64 cleanup workers) can burst well past a token's budget, so at that size **GitHub App authentication is effectively required**.

## Anti-patterns

Each of these is one flag out of proportion with the rest:

- **64 runner workers with the default 20 QPS.** The workers spend their time queued behind the client limiter, and it's worse than the defaults. A balanced 16 workers at 50 QPS beats it. If the API server can't take more QPS, lower the workers instead of starving them.
- **Set-level workers above your scale set count.** 32 AutoscalingRunnerSet workers with 5 scale sets means 27 that never get work. Size those flags to the scale set count, not the runner count.
- **`--sync-period=10m` with `--default-scale-down-delay=1m`.** The 1-minute delay becomes ~10 minutes in practice.
- **Burst below QPS.** Burst is the size of the bucket, so a burst under QPS makes the QPS you set unreachable.
- **Raising listener workers first.** There's one AutoscalingListener per scale set, its reconciles are the cheapest of the four (make sure the listener pod and its secret exist, patch status), and the listener pod does its own long polling. It's the last place to add workers.

## Checking your work

The controller's metrics endpoint (`--metrics-addr`) shows which limit you're hitting:

| Signal | What it tells you |
| --- | --- |
| `workqueue_depth` (by controller) | Which queue is backing up. Rising while workers are busy: add workers. |
| `rest_client_requests_total` (and `rest_client_request_latency_seconds`) | Whether the Kubernetes client is saturated. Flat at your QPS: the client limiter is the ceiling. |
| `controller_runtime_reconcile_time_seconds` | Time per reconcile: are the workers the bottleneck, or the API server and GitHub behind them? |
| GitHub rate-limit headers (`x-ratelimit-remaining`, `x-ratelimit-reset`) | How much GitHub budget is left before the hour resets. |

If `workqueue_depth` for the EphemeralRunner controller is already near zero, raising QPS further does nothing: the workers aren't waiting.

Tune in this order, one change at a time, and check the signals between each:

1. Runner workers (`--ephemeral-runner-max-concurrent-reconciles`)
2. Client QPS and burst
3. Set-level workers (up to your scale set count)
4. Workqueue limiter
5. Sync period

Most clusters can stop at step 2. If you get to step 5, the [upstream discussion](https://github.com/actions/actions-runner-controller/issues/3021) has real-world numbers worth a read.
