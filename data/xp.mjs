// The About card's XP timeline (components/AboutCard.vue): certifications and education, work
// history and achievements. Also read by the glossary test (tests/app/glossary.test.mjs).

// XP: certifications and education, then work history (newest first). `readable` and
// `highlight` are the plain-English text; the JSON view uses the fields only.
export const education = [
  // The AMGA SPI certification is the course plus a separate exam: only the course is done
  {
    category: 'Education',
    program: 'AMGA Single Pitch Instructor (SPI) Course',
    passed: 'May 2026',
    status: 'Course passed; SPI exam not yet taken (certification needs both)',
    school: 'Pisgah Climbing School',
    location: 'Brevard, NC',
    date: 'Passed May 2026',
    readable: 'AMGA Single Pitch Instructor (SPI) Course with Pisgah Climbing School in Brevard, NC. The SPI certification also needs the separate SPI exam, which I haven\'t taken yet.'
  },
  {
    category: 'Certification',
    certification: 'Data Science and Machine Learning: Making Data-Driven Decisions',
    passed: 'September 2024',
    school: 'MIT Institute for Data, Systems, and Society (IDSS)',
    location: 'Online',
    date: 'Passed September 2024',
    readable: 'Certification: Data Science and Machine Learning: Making Data-Driven Decisions from MIT IDSS.'
  },
  {
    category: 'Education',
    graduated: 2025,
    program: 'YTT200',
    school: 'Chakra Flow University',
    location: 'Charlotte, NC',
    date: '2025',
    readable: '200-hour Yoga Teacher Training Graduate from Chakra Flow University at the Whitewater Center in Charlotte, NC.'
  },
  {
    category: 'Education',
    started: 2016,
    graduated: 2019,
    program: 'Computer Science, BS / Communication Studies Minor',
    school: 'UNC Charlotte',
    location: 'Charlotte, NC',
    date: '2016 – 2019',
    readable: 'Bachelor of Science in Computer Science with a minor in Communication Studies from UNC Charlotte in Charlotte, NC.'
  }
]

export const experience = [
  { category: 'Work', role: 'Senior Software Engineer', company: 'Wells Fargo', start: 'Sep 2025', end: 'Present', location: 'Charlotte, NC', highlight: 'Engineer, develop and maintain GitHub Actions, ARC, Workflows and Kubernetes enterprise-wide platform solutions; lead projects and act as an escalation point for less experienced staff' },
  { category: 'Work', role: 'Software Engineer 4', company: 'Apex Systems (Wells Fargo)', start: 'Jun 2025', end: 'Sep 2025', location: 'Hybrid', highlight: 'Engineered language-specific GitHub Actions support across Python, Ruby, C#, Node.js and Java; built GitHub-hosted runners on Azure VNet and customized self-hosted runners for TKGI and OpenShift' },
  { category: 'Volunteer', role: 'Voluntary work', company: 'Project H.E.R.O., Jubilee House Community', start: 'Jan 2025', end: 'May 2025', location: 'Remote', highlight: 'Founding project manager and lead maintainer of an open-source naloxone vending machine project' },
  { category: 'Work', role: 'Senior Software Engineer', company: 'Brooksource (Ally Financial)', start: 'Jun 2024', end: 'Dec 2024', location: 'Charlotte, NC, hybrid', highlight: 'GenAI and RAG for audit, compliance and risk; migrated a React app to Vite (95% faster build and runtime); AWS and Terraform infrastructure; Technology Achievement Award for a 25% cut in audit processing time' },
  { category: 'Career break', role: 'Career break', start: 'Apr 2024', end: 'Jun 2024', highlight: 'Position eliminated' },
  { category: 'Work', role: 'Senior Software Developer', company: 'TIAA', start: 'Mar 2022', end: 'Apr 2024', location: 'United States', highlight: 'Founded the Developer Experience Guild; platform SME across the enterprise; L3 platform support and continuous improvement on OpenShift, Kong and CI/CD' },
  { category: 'Work', role: 'Developer II', company: 'TIAA', start: 'Jan 2021', end: 'Mar 2022', location: 'Charlotte, NC', highlight: 'Full-stack development and solution architecture for imaging, data distribution and workflow systems' },
  { category: 'Work', role: 'Developer', company: 'TIAA', start: 'Jan 2020', end: 'Jan 2021', location: 'Charlotte, NC', highlight: 'Full-stack development on the TIAA Robotics Platform and Imaging Distribution; reverse-engineered and refactored legacy monoliths into microservices with Spring Boot and OpenShift' },
  { category: 'Work', role: 'Full Stack Developer, Robotics Platform', company: 'TIAA (Brooksource)', start: 'Jul 2019', end: 'Jan 2020', location: 'Charlotte, NC', highlight: 'Automation Anywhere RPA bots and process intelligence systems; LSTM text classification model; cognitive services platform for text, voice and object detection' },
  { category: 'Work', role: 'Computer Scientist (Research and Development)', company: 'National Gypsum Company', start: 'May 2019', end: 'Jul 2019', location: 'Charlotte, NC', highlight: 'Azure Machine Learning deployment for material science; migrated ensemble ML from Python to C#/.NET; UX research and an analytics dashboard' },
  { category: 'Work', role: 'Computer Science Intern (Research and Development)', company: 'National Gypsum Company', start: 'Jan 2019', end: 'May 2019', location: 'Charlotte Metro', highlight: 'Partnered with Microsoft engineers on Azure AI data modeling and data science pipelines for real-time and batch processing; prototyped Azure ML environments; built a Power BI visualization and a data analytics dashboard proof of concept' },
  { category: 'Work', role: 'College of Computing and Informatics Tutor', company: 'UNC Charlotte', start: 'Jan 2017', end: 'May 2019', location: 'Charlotte, NC', highlight: 'One-on-one tutoring for 10+ undergrad and grad CS students in Java, C, data structures, machine learning, AWS and networking; won HackNC 2018 (Major League Hacking\'s 2019 season); gave over a dozen workshops at hackathons and campus events' },
  { category: 'Volunteer', role: 'Guest speaker, GenCyber camp', company: 'Winthrop University, Richard W. Riley College of Education', start: '2017', end: '2017', location: 'Rock Hill, SC', highlight: 'Demonstrated open wireless network insecurity and how to ethically hack a network for teachers and students, as a student and computer science peer tutor at UNC Charlotte' },
  { category: 'Work', role: 'Associate', company: 'Carowinds', start: 'Apr 2016', end: 'Oct 2016', location: 'Charlotte Metro', highlight: 'Cashier supervisor responsible for handling money; supervised a team and improved customer satisfaction and accountability' },
  { category: 'Work', role: 'Computer Repair Technician / Network Designer (self-employed)', start: 'Jul 2014', end: 'Jul 2017', highlight: 'Remote support by phone, email and TeamViewer; on-site hardware upgrades and FRU repairs; network, server and security design for small businesses' }
]

// Achievements: milestones on the XP timeline (the medal). `date` is when it happened; MLH
// hackathons also carry their Major League Hacking season, which runs from late summer to early
// summer and is named for the year it ends (fall 2018 events are the 2019 season)
export const achievements = [
  {
    category: 'Achievement',
    event: 'MLH: hackathonCLT MMXIX',
    season: 'MLH 2019 season',
    place: 'Submitted',
    date: '2019',
    location: 'Charlotte, NC',
    readable: 'Submitted a project to hackathonCLT MMXIX (MLH 2019 season) in Charlotte, NC (March 2019).'
  },
  {
    category: 'Achievement',
    event: 'MLH: HackDuke 2018: Code for Good',
    season: 'MLH 2019 season',
    place: 'Submitted',
    date: '2018',
    location: 'Durham, NC',
    readable: 'Submitted a project to HackDuke 2018: Code for Good (MLH 2019 season) in Durham, NC (October 2018).'
  },
  {
    category: 'Achievement',
    event: 'MLH: HackNC 2018',
    season: 'MLH 2019 season',
    place: 'Winner',
    project: 'Human Trafficking Textual and Emoji Analysis',
    description: 'Feature generation and emoji text analysis, for machine learning, to help prevent human trafficking.',
    date: '2018',
    location: 'Chapel Hill, NC',
    readable: 'Winner at HackNC 2018 (MLH 2019 season) in Chapel Hill, NC (October 2018) with Human Trafficking Textual and Emoji Analysis: feature generation and emoji text analysis to help prevent human trafficking.'
  },
  {
    category: 'Achievement',
    event: 'MLH: HackDuke 2017: Code for Good',
    season: 'MLH 2018 season',
    place: 'Submitted',
    date: '2017',
    location: 'Durham, NC',
    readable: 'Submitted a project to HackDuke 2017: Code for Good (MLH 2018 season) in Durham, NC (October 2017).'
  },
  {
    category: 'Achievement',
    event: 'MLH: RamHacks 2017',
    season: 'MLH 2018 season',
    place: 'Submitted',
    project: 'ramhacksfall2017',
    date: '2017',
    location: 'Richmond, VA',
    readable: 'Submitted ramhacksfall2017 to RamHacks 2017 (MLH 2018 season) in Richmond, VA (September 2017).'
  },
  {
    category: 'Achievement',
    event: 'Collegiate Cyber Defense Competition (CCDC), Southeast Regional Finals',
    place: 'Fourth at Kennesaw State University (UNC Charlotte team)',
    date: '2018',
    location: 'Kennesaw, GA',
    readable: 'Fourth place: UNC Charlotte team at the Southeast Regional Finals of the Collegiate Cyber Defense Competition (CCDC) at Kennesaw State University (2018).'
  },
  {
    category: 'Achievement',
    event: 'Around the Crown 10K',
    distance: '10K',
    first: true,
    date: 'Sep 2026',
    location: 'Charlotte, NC',
    readable: 'First 10K: Around the Crown 10K in Charlotte, NC.'
  }
]
