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
  'ci-cd': {
    term: 'CI/CD',
    short: 'Continuous integration and delivery: every code change is built, tested and shipped automatically.',
    href: 'https://en.wikipedia.org/wiki/CI/CD'
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
  'guide-mode': {
    term: 'Guide Mode',
    short: 'A belay device setup for belaying a climber from above that locks the rope on its own.',
    href: 'https://en.wikipedia.org/wiki/Belay_device',
    aliases: ['GuideMode']
  },
  idss: {
    term: 'IDSS',
    short: 'MIT\'s Institute for Data, Systems, and Society.',
    href: 'https://idss.mit.edu'
  },
  kong: {
    term: 'Kong',
    short: 'Kong Gateway: an API gateway that routes and secures the traffic between apps and services.',
    href: 'https://konghq.com'
  },
  l3: {
    term: 'L3',
    short: 'Level 3 support: the last line of technical support, where the hardest problems go and get fixed in the platform itself.',
    href: 'https://en.wikipedia.org/wiki/Technical_support#Multi-tiered_technical_support'
  },
  lstm: {
    term: 'LSTM',
    short: 'Long short-term memory: a kind of neural network that learns from sequences, like text.',
    href: 'https://en.wikipedia.org/wiki/Long_short-term_memory'
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
  rpa: {
    term: 'RPA',
    short: 'Robotic process automation: software "bots" that do repetitive computer tasks.',
    href: 'https://en.wikipedia.org/wiki/Robotic_process_automation'
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
  unc: {
    term: 'UNC Charlotte',
    short: 'The University of North Carolina at Charlotte.',
    href: 'https://www.charlotte.edu'
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
  xp: {
    term: 'XP',
    short: 'Experience: work, school and achievements, like a game\'s experience points. The XP tab on the home page has the timeline.',
    href: '/#xp'
  }
}

// The entry for an id, only for real entries (ids come from markup: "__proto__" must not match)
export const glossaryEntry = id => (typeof id === 'string' && Object.hasOwn(glossary, id) ? glossary[id] : null)
