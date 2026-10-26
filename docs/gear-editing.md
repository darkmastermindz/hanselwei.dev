# Editing gear lists

How an edit made on `/gear/<list>` becomes a commit in the **Gear updates** pull request. More detail is in the README, under "Editing gear lists".

**No secret is stored anywhere:**
- The site signs edits with a key derived from the sign-in secret it already has.
- The workflow signs in to the site with a token GitHub mints for that one run.

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Owner (signed in)
    participant Page as /gear/:list<br/>(useGearEditor)
    participant Submit as /api/gear/submit
    participant Store as Netlify Blobs<br/>"gear-edits"
    participant Workflow as Gear updates workflow<br/>(GitHub Actions)
    participant GitHub as GitHub<br/>(OIDC + API)
    participant Pending as /api/gear/pending
    participant Verify as /api/gear/verify

    Owner->>Page: ✏️ Edit list: change, add, remove items
    Note over Page: Unsent changes stay in this browser<br/>(Undo / Discard all)
    Owner->>Page: Send for review
    Page->>Submit: POST { list, ops } + session cookie
    Note over Submit: Owner session? Same origin?<br/>validateOps → canonical changes
    Submit->>Submit: Sign: HMAC(email, list, sha256(ops))<br/>key from GITHUB_CLIENT_SECRET
    Submit->>Store: setJSON pending/time-random<br/>{ list, ops, token, at }
    Submit-->>Page: { ok }
    Page-->>Owner: Sent

    Note over Workflow: Weekly · push to main · on demand
    Workflow->>GitHub: Ask for an OIDC token<br/>(audience hanselwei.dev/gear-updates)
    GitHub-->>Workflow: Token signed by GitHub<br/>(repo, workflow, ref = main)
    Workflow->>Pending: GET + Bearer token
    Pending->>GitHub: GitHub's public keys (cached for an hour)
    Note over Pending: RS256 only · issuer · audience<br/>repository · gear-updates.yml@main · expiry
    Pending->>Store: list pending/*
    Pending-->>Workflow: Pending edits, oldest first

    loop Each edit
        Workflow->>Verify: { list, ops, token, at }
        Verify-->>Workflow: 200 (an owner signed exactly this) or 403 (dropped)
    end

    Workflow->>Workflow: applyOps → data/gear/:list.json<br/>one commit per edit on gear-updates<br/>npm test
    Workflow->>GitHub: Push gear-updates and open or update<br/>the "Gear updates" pull request
    Workflow->>Pending: DELETE { keys } + fresh token
    Pending->>Store: Delete the handled pending/* keys
    Owner->>GitHub: Merge the pull request → the lists go live
```

## Who can do what

```mermaid
flowchart LR
    A[Visitor] -- "no session: 401" --x S["/api/gear/submit"]
    O[Signed-in owner] -- "session cookie" --> S
    S -- "signed edit" --> B[("Netlify Blobs<br/>pending/*")]
    W["Gear updates workflow<br/>on main"] -- "GitHub OIDC token" --> P["/api/gear/pending"]
    X["Any other caller, workflow or branch"] -- "401" --x P
    P -- "read, delete" --> B
    W -- "each edit" --> V["/api/gear/verify"]
    V -- "yes or no only" --> W
```
