// Acronyms, lingo and jargon used on the site, each with a short plain-English definition and a
// link to where it comes from (README "Glossary terms"). <Term> and <TermText> mark them in
// Vue-rendered text, glossaryHtml() in rendered markdown; <TermTip> shows the definition on hover,
// focus or tap. New display text that uses a term not listed here: add it (tests/app/glossary.test.mjs
// fails on an unlisted acronym), or say it in plain words.
//
// Each entry: `term` as written, `short` (one or two sentences), `href` (https, or a path on this
// site), and optional `aliases`: other spellings that mean the same.
export const glossary = {
  amga: {
    term: 'AMGA',
    short: 'American Mountain Guides Association: trains and certifies climbing instructors and mountain guides in the US.',
    href: 'https://amga.com'
  },
  api: {
    term: 'API',
    short: 'Application programming interface: a set way for one program to ask another for data or to do something.',
    href: 'https://en.wikipedia.org/wiki/API',
    aliases: ['APIs']
  },
  arc: {
    term: 'ARC',
    short: 'Actions Runner Controller: runs GitHub Actions jobs on your own Kubernetes cluster.',
    href: 'https://github.com/actions/actions-runner-controller'
  },
  'assisted-braking': {
    term: 'Assisted Braking',
    short: 'A belay device that helps catch and hold the rope when a climber falls.',
    href: 'https://en.wikipedia.org/wiki/Belay_device',
    aliases: ['AssistedBraking']
  },
  aws: {
    term: 'AWS',
    short: 'Amazon Web Services: Amazon\'s cloud computing platform.',
    href: 'https://aws.amazon.com'
  },
  ccdc: {
    term: 'CCDC',
    short: 'Collegiate Cyber Defense Competition: student teams keep a business network running while a live "red team" attacks it.',
    href: 'https://www.nationalccdc.org'
  },
  cdn: {
    term: 'CDN',
    short: 'Content delivery network: servers around the world that keep copies of a site, so pages load from somewhere close to you.',
    href: 'https://en.wikipedia.org/wiki/Content_delivery_network',
    aliases: ['CDNs']
  },
  'ci-cd': {
    term: 'CI/CD',
    short: 'Continuous integration and delivery: every code change is built, tested and shipped automatically.',
    href: 'https://en.wikipedia.org/wiki/CI/CD'
  },
  cli: {
    term: 'CLI',
    short: 'Command-line interface: a program you use by typing commands in a terminal.',
    href: 'https://en.wikipedia.org/wiki/Command-line_interface',
    aliases: ['CLIs']
  },
  cms: {
    term: 'CMS',
    short: 'Content management system: software for writing and publishing web pages without editing code (WordPress is one).',
    href: 'https://en.wikipedia.org/wiki/Content_management_system',
    aliases: ['CMSs']
  },
  css: {
    term: 'CSS',
    short: 'Cascading Style Sheets: the language that sets how web pages look (colours, layout, fonts).',
    href: 'https://developer.mozilla.org/docs/Web/CSS'
  },
  devops: {
    term: 'DevOps',
    short: 'Building, testing and running software as one team, with as much of it automated as possible.',
    href: 'https://en.wikipedia.org/wiki/DevOps'
  },
  docker: {
    term: 'Docker',
    short: 'A tool that packs an app and everything it needs into a container, so it runs the same everywhere.',
    href: 'https://www.docker.com'
  },
  fru: {
    term: 'FRU',
    short: 'Field-replaceable unit: a computer part (drive, power supply, memory) swapped on site instead of sending the machine away.',
    href: 'https://en.wikipedia.org/wiki/Field-replaceable_unit'
  },
  genai: {
    term: 'GenAI',
    short: 'Generative AI: models that write text, code or images.',
    href: 'https://en.wikipedia.org/wiki/Generative_artificial_intelligence'
  },
  git: {
    term: 'Git',
    short: 'A version control system: it keeps the history of every change to a project\'s files.',
    href: 'https://git-scm.com'
  },
  'github-actions': {
    term: 'GitHub Actions',
    short: 'GitHub\'s automation: runs builds, tests and deploys when code changes.',
    href: 'https://docs.github.com/actions'
  },
  graphql: {
    term: 'GraphQL',
    short: 'A way for an app to ask a server for exactly the data it needs in one request.',
    href: 'https://graphql.org'
  },
  'guide-mode': {
    term: 'Guide Mode',
    short: 'A belay device setup for belaying a climber from above that locks the rope on its own.',
    href: 'https://en.wikipedia.org/wiki/Belay_device',
    aliases: ['GuideMode']
  },
  'headless-cms': {
    term: 'Headless CMS',
    short: 'A content management system that only stores the content and hands it out through an API; the site\'s own code decides how it looks.',
    href: 'https://en.wikipedia.org/wiki/Headless_content_management_system',
    aliases: ['headless']
  },
  html: {
    term: 'HTML',
    short: 'HyperText Markup Language: the language web pages are written in.',
    href: 'https://developer.mozilla.org/docs/Web/HTML'
  },
  idss: {
    term: 'IDSS',
    short: 'MIT\'s Institute for Data, Systems, and Society.',
    href: 'https://idss.mit.edu'
  },
  jamstack: {
    term: 'Jamstack',
    short: 'JavaScript, APIs and Markup: websites built ahead of time as plain pages, with JavaScript and APIs adding anything that changes.',
    href: 'https://jamstack.org',
    aliases: ['JAMstack', 'JAM']
  },
  javascript: {
    term: 'JavaScript',
    short: 'The programming language that runs in web pages and makes them interactive.',
    href: 'https://developer.mozilla.org/docs/Web/JavaScript',
    aliases: ['JS']
  },
  json: {
    term: 'JSON',
    short: 'JavaScript Object Notation: a simple text format for data, like { "name": "value" }.',
    href: 'https://www.json.org'
  },
  jwt: {
    term: 'JWT',
    short: 'JSON Web Token: a signed piece of text that proves who you are to a server.',
    href: 'https://jwt.io/introduction',
    aliases: ['JWTs']
  },
  kong: {
    term: 'Kong',
    short: 'Kong Gateway: an API gateway that routes and secures the traffic between apps and services.',
    href: 'https://konghq.com'
  },
  kubernetes: {
    term: 'Kubernetes',
    short: 'A system that runs and manages many containers across many servers.',
    href: 'https://kubernetes.io',
    aliases: ['K8s']
  },
  l3: {
    term: 'L3',
    short: 'Level 3 support: the last line of technical support, where the hardest problems go and get fixed in the platform itself.',
    href: 'https://en.wikipedia.org/wiki/Technical_support#Multi-tiered_technical_support'
  },
  llm: {
    term: 'LLM',
    short: 'Large language model: an AI trained on lots of text to read and write language, like Claude or ChatGPT.',
    href: 'https://en.wikipedia.org/wiki/Large_language_model',
    aliases: ['LLMs']
  },
  lstm: {
    term: 'LSTM',
    short: 'Long short-term memory: a kind of neural network that learns from sequences, like text.',
    href: 'https://en.wikipedia.org/wiki/Long_short-term_memory'
  },
  markdown: {
    term: 'Markdown',
    short: 'A simple way to format plain text (# for headings, * for lists) that turns into a web page. This blog is written in it.',
    href: 'https://en.wikipedia.org/wiki/Markdown'
  },
  ml: {
    term: 'ML',
    short: 'Machine learning: software that learns patterns from data instead of following hand-written rules.',
    href: 'https://en.wikipedia.org/wiki/Machine_learning'
  },
  mlh: {
    term: 'MLH',
    short: 'Major League Hacking: the official student hackathon league. Its seasons run late summer to early summer, named for the year they end.',
    href: 'https://mlh.io'
  },
  mmxix: {
    term: 'MMXIX',
    short: '2019 in Roman numerals.',
    href: 'https://en.wikipedia.org/wiki/Roman_numerals'
  },
  nd: {
    term: 'ND',
    short: 'Neutral density filter: darkens the whole picture evenly, for slower shutter speeds or wider apertures in bright light.',
    href: 'https://en.wikipedia.org/wiki/Neutral-density_filter'
  },
  netlify: {
    term: 'Netlify',
    short: 'A web hosting platform that builds and serves sites like this one.',
    href: 'https://www.netlify.com'
  },
  npm: {
    term: 'npm',
    short: 'The package manager for JavaScript: it installs the libraries a project uses.',
    href: 'https://www.npmjs.com'
  },
  nuxt: {
    term: 'Nuxt',
    short: 'A framework on top of Vue for building whole websites. This site is built with it.',
    href: 'https://nuxt.com'
  },
  oauth: {
    term: 'OAuth',
    short: 'A standard way to let one app use your account on another (like "Sign in with GitHub") without sharing your password.',
    href: 'https://oauth.net/2/'
  },
  openshift: {
    term: 'OpenShift',
    short: 'Red Hat\'s Kubernetes platform for running apps in containers.',
    href: 'https://www.redhat.com/en/technologies/cloud-computing/openshift'
  },
  pfd: {
    term: 'PFD',
    short: 'Personal flotation device: a life jacket or inflatable belt pack worn on the water.',
    href: 'https://en.wikipedia.org/wiki/Personal_flotation_device'
  },
  'power-bi': {
    term: 'Power BI',
    short: 'Microsoft\'s business intelligence tool for dashboards and reports.',
    href: 'https://www.microsoft.com/power-platform/products/power-bi'
  },
  pwa: {
    term: 'PWA',
    short: 'Progressive web app: a website you can install and use like an app, even offline.',
    href: 'https://web.dev/explore/progressive-web-apps',
    aliases: ['PWAs']
  },
  rag: {
    term: 'RAG',
    short: 'Retrieval-augmented generation: an AI model looks up relevant documents first, then answers from them.',
    href: 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation'
  },
  resoled: {
    term: 'Resoled',
    short: 'Climbing shoes given new rubber soles, so a favourite pair lasts longer.',
    href: 'https://en.wikipedia.org/wiki/Climbing_shoe'
  },
  rest: {
    term: 'REST',
    short: 'A common style for web APIs: each address is a thing, and GET, POST and so on read or change it.',
    href: 'https://en.wikipedia.org/wiki/REST'
  },
  rpa: {
    term: 'RPA',
    short: 'Robotic process automation: software "bots" that do repetitive computer tasks.',
    href: 'https://en.wikipedia.org/wiki/Robotic_process_automation'
  },
  rss: {
    term: 'RSS',
    short: 'A feed of a site\'s new posts that reader apps can follow, so you don\'t have to check back.',
    href: 'https://en.wikipedia.org/wiki/RSS'
  },
  sdk: {
    term: 'SDK',
    short: 'Software development kit: the libraries and tools for building on a platform.',
    href: 'https://en.wikipedia.org/wiki/Software_development_kit',
    aliases: ['SDKs']
  },
  seo: {
    term: 'SEO',
    short: 'Search engine optimisation: making pages easy for search engines to find and understand.',
    href: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'
  },
  sme: {
    term: 'SME',
    short: 'Subject-matter expert: the go-to person for a system or topic.',
    href: 'https://en.wikipedia.org/wiki/Subject-matter_expert'
  },
  spi: {
    term: 'SPI',
    short: 'Single Pitch Instructor: the AMGA certification for teaching climbing on one-rope-length crags. It takes a course and a separate exam.',
    href: 'https://en.wikipedia.org/wiki/American_Mountain_Guides_Association'
  },
  sql: {
    term: 'SQL',
    short: 'Structured Query Language: the language for asking a database for data.',
    href: 'https://en.wikipedia.org/wiki/SQL'
  },
  ssr: {
    term: 'SSR',
    short: 'Server-side rendering: building a page on the server so it arrives ready to read.',
    href: 'https://en.wikipedia.org/wiki/Server-side_scripting'
  },
  sup: {
    term: 'SUP',
    short: 'Stand-up paddleboarding: standing on a large board and paddling.',
    href: 'https://en.wikipedia.org/wiki/Standup_paddleboarding'
  },
  tiaa: {
    term: 'TIAA',
    short: 'Teachers Insurance and Annuity Association of America: a financial services company for people in academic, medical, cultural and research fields.',
    href: 'https://www.tiaa.org'
  },
  tkgi: {
    term: 'TKGI',
    short: 'VMware Tanzu Kubernetes Grid Integrated: VMware\'s platform for running Kubernetes.',
    href: 'https://en.wikipedia.org/wiki/VMware_Tanzu'
  },
  typescript: {
    term: 'TypeScript',
    short: 'JavaScript with types, which catch many mistakes before the code runs.',
    href: 'https://www.typescriptlang.org'
  },
  ui: {
    term: 'UI',
    short: 'User interface: the screens, buttons and text you use something through.',
    href: 'https://en.wikipedia.org/wiki/User_interface'
  },
  unc: {
    term: 'UNC Charlotte',
    short: 'The University of North Carolina at Charlotte.',
    href: 'https://www.charlotte.edu'
  },
  url: {
    term: 'URL',
    short: 'A web address, like https://hanselwei.dev.',
    href: 'https://developer.mozilla.org/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL',
    aliases: ['URLs']
  },
  uv: {
    term: 'UV',
    short: 'Ultraviolet filter: a clear filter that cuts haze and protects the lens\'s front glass.',
    href: 'https://en.wikipedia.org/wiki/Photographic_filter#Ultraviolet'
  },
  ux: {
    term: 'UX',
    short: 'User experience: how easy and pleasant something is to use.',
    href: 'https://en.wikipedia.org/wiki/User_experience'
  },
  vnet: {
    term: 'VNet',
    short: 'Azure Virtual Network: a private network inside Microsoft Azure.',
    href: 'https://learn.microsoft.com/azure/virtual-network/virtual-networks-overview'
  },
  vue: {
    term: 'Vue',
    short: 'A JavaScript framework for building web pages out of components. This site uses it.',
    href: 'https://vuejs.org',
    aliases: ['Vue.js']
  },
  xp: {
    term: 'XP',
    short: 'Experience: work, school and achievements, like a game\'s experience points. The XP tab on the home page has the timeline.',
    href: '/#xp'
  }
}

// The entry for an id, only for real entries (ids come from markup: "__proto__" must not match)
export const glossaryEntry = id => (typeof id === 'string' && Object.hasOwn(glossary, id) ? glossary[id] : null)
