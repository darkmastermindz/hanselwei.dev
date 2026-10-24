<template>
  <main class="page">
    <article class="terms">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h1>Terms of Service</h1>
      <p>©️ 2026 hanselwei.dev</p>
      <p>
        This website's
        <a href="https://github.com/darkmastermindz/hanselwei.dev" target="_blank" rel="noopener">source code</a>
        is licensed under the BSD 3-Clause License. Its personal content is not: it may not be reproduced or
        distributed without written permission.
      </p>

      <h2>Personal content</h2>
      <p>
        "Personal Content" means material of a personal nature that appears on or is included with the website,
        whether stored in separate files or within the source code, including, without limitation: written content
        such as blog posts and biographical or "about" text; photographs, images and other likenesses of Hansel Wei;
        personal information, accounts and contact details; and personal lists and data such as gear inventories and
        hobby facts.
      </p>
      <p>
        Personal Content is © Hansel Wei, all rights reserved. It may not be reproduced, distributed, publicly
        displayed or otherwise made available, in whole or in part, by itself or as part of any redistribution or
        derivative of the website or its source code, without specific prior written permission from the copyright
        holder. Personal Content must be removed from any redistribution of the source code. The BSD 3-Clause License
        below does not apply to it.
      </p>

      <h2>Source code: BSD 3-Clause License</h2>
      <p>Copyright (c) 2026, Hansel Wei</p>
      <p>
        Redistribution and use in source and binary forms, with or without modification, are permitted provided that
        the following conditions are met:
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


      <h2>Permission</h2>
      <p>
        To ask for permission, email
        <a href="mailto:hello+hansel@hanselwei.dev">hello+hansel@hanselwei.dev</a>.
      </p>
      <p>
        Open-source software used by the site keeps its own licenses; see
        <NuxtLink to="/credits">Open source software &lt;3</NuxtLink>.
      </p>
    </article>
  </main>
</template>

<script setup>
useHead({
  title: 'Terms of Service · Hansel Wei',
  meta: [
    {
      name: 'description',
      content:
        'The source code of hanselwei.dev is licensed under the BSD 3-Clause License; its personal content may not be reproduced or distributed without written permission.'
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
  text-decoration: underline; /* links in running text need more than colour */
  text-underline-offset: 2px;
}

.back {
  color: #fbbf24;
}
</style>
