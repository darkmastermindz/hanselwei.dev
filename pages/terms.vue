<template>
  <main class="page">
    <article class="terms">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h1>Terms of Service</h1>
      <p>©️ 2026 hanselwei.dev</p>

      <h2>Website content</h2>
      <p>
        The writing, photographs, images and design of this website are © Hansel Wei, all rights reserved. They may
        not be reproduced without written permission.
      </p>
      <p>
        To ask for permission, email
        <a href="mailto:hello+hansel@hanselwei.dev">hello+hansel@hanselwei.dev</a>.
      </p>

      <h2>Source code</h2>
      <p>
        The website's
        <a href="https://github.com/darkmastermindz/hanselwei.dev" target="_blank" rel="noopener">source code</a>
        is licensed under the BSD 3-Clause License. Copyright (c) 2026, Hansel Wei. Redistribution and use in source
        and binary forms, with or without modification, are permitted provided that the following conditions are met:
      </p>
      <ol>
        <li>
          Redistributions of source code must retain the above copyright notice, this list of conditions and the
          following disclaimer.
        </li>
        <li>
          Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
          following disclaimer in the documentation and/or other materials provided with the distribution.
        </li>
        <li>
          Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
          products derived from this software without specific prior written permission.
        </li>
      </ol>
      <p class="terms__disclaimer">
        THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
        WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
        PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY
        DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
        PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
        CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
        OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
        DAMAGE.
      </p>
      <p>
        The license covers the code only, not the website content above. Open-source software used by the site keeps
        its own licenses; see <NuxtLink to="/credits">Open source software &lt;3</NuxtLink>.
      </p>
    </article>
  </main>
</template>

<script setup>
useHead({
  title: 'Terms of Service · hanselwei.dev',
  meta: [
    {
      name: 'description',
      content:
        'The content of hanselwei.dev may not be reproduced without written permission; its source code is licensed under the BSD 3-Clause License.'
    }
  ]
})
</script>

<style scoped>
.terms {
  max-width: 46rem;
  margin: 0 auto;
  color: #ddd;
  line-height: 1.7;
}

.terms h1 {
  font-size: clamp(1.8rem, 7vw, 2.5rem);
  margin: 1rem 0;
}

.terms h2 {
  font-size: 1.25rem;
  margin: 1.75rem 0 0.75rem;
}

.terms p {
  margin-bottom: 1rem;
}

.terms ol {
  list-style: decimal;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.terms li {
  margin-bottom: 0.5rem;
}

.terms__disclaimer {
  font-size: 0.8rem;
  color: #aaa;
  overflow-wrap: anywhere;
}

.terms a {
  color: #fbbf24;
}

.back {
  color: #fbbf24;
}
</style>
