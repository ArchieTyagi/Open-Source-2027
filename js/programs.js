/* programs.js
   The programs: names, colours, links, starting milestones and starting dates.
   Every program page (gsoc.html, esoc.html, lfx.html, sob.html, outreachy.html,
   fossee.html, fossoverflow.html) uses ONE template
   (js/pages/program.js). It reads its program from this list.

   Dates for 2027 are not announced yet. Every starting date below is labelled:
     expected = a guess based on the 2026 dates, written in the note
     proposed = your own plan
   Change a label to "official" once you check the real 2027 date. */

(function (App) {
  App.PROGRAM_ORDER = ['gsoc', 'esoc', 'lfx', 'sob', 'outreachy', 'fossee', 'fossoverflow'];

  App.PROGRAMS = {
    gsoc: {
      id: 'gsoc',
      short: 'GSoC',
      title: 'GSoC 2027',
      name: 'Google Summer of Code',
      page: 'gsoc.html',
      site: 'https://summerofcode.withgoogle.com',
      milestones: [
        'Pick 2 or 3 orgs',
        "Join the org's chat",
        'Fork the repo',
        'Read the README and contributing guide',
        'Set up locally',
        'First PR merged',
        'Talk to a mentor about an idea',
        'Submit the proposal'
      ],
      timeline: [
        { date: '2026-11', title: 'Pick orgs and make first contributions', tag: 'proposed', note: '' },
        { date: '2027-02', title: 'Org list is published', tag: 'expected', note: '2026: 19.02.2026' },
        { date: '2027-03', title: 'Contributor applications open', tag: 'expected', note: '2026: 16.03.2026' },
        { date: '2027-03', title: 'Applications close', tag: 'expected', note: '2026: 31.03.2026' },
        { date: '2027-04', title: 'Accepted projects announced', tag: 'expected', note: '2026: 30.04.2026' },
        { date: '2027-05', title: 'Coding starts', tag: 'expected', note: '2026: 25.05.2026' },
        { date: '2027-08', title: 'Final evaluations', tag: 'expected', note: '2026: 17.08.2026 to 24.08.2026' }
      ]
    },

    esoc: {
      id: 'esoc',
      short: 'ESoC',
      title: 'ESoC 2027',
      name: 'European Summer of Code',
      page: 'esoc.html',
      site: 'https://www.esoc.dev',
      milestones: [
        'Read the ESoC site and the hub list',
        'Pick a project',
        'Fork the repo',
        'Set up locally',
        'Finish the entrance task PR',
        'Write the proposal (if the project asks)',
        'Prepare a 5 minute code demo',
        'Do the interview'
      ],
      timeline: [
        { date: '2026-11', title: 'Make first contributions', tag: 'proposed', note: '' },
        { date: '2027-01', title: 'Projects start being posted', tag: 'expected', note: 'Projects are posted on a rolling basis. Check esoc.dev.' },
        { date: '2027-03', title: 'Entrance task PR done', tag: 'proposed', note: '' },
        { date: '2027-04', title: 'Interview', tag: 'expected', note: 'About 30 minutes, with a 5 minute code demo. Month is a guess.' },
        { date: '2027-06', title: '3 month project starts', tag: 'expected', note: 'Month is a guess. Check your hub.' }
      ]
    },

    lfx: {
      id: 'lfx',
      short: 'LFX',
      title: 'LFX 2027',
      name: 'LFX Mentorship (Linux Foundation)',
      page: 'lfx.html',
      site: 'https://mentorship.lfx.linuxfoundation.org',
      milestones: [
        'Pick a term (Spring, Summer or Fall)',
        'Shortlist projects on LFX Mentorship',
        'Make an LFX profile',
        'Set up the project locally',
        'First PR merged',
        "Finish the project's prerequisite task",
        'Write the cover letter',
        'Apply before the deadline'
      ],
      timeline: [
        { date: '2026-11', title: 'Make first contributions', tag: 'proposed', note: '' },
        { date: '2027-01', title: 'Spring term projects listed', tag: 'expected', note: 'LFX docs: mid-January. Applications stay open about 4 weeks.' },
        { date: '2027-03-01', title: 'Spring term starts', tag: 'expected', note: 'Runs to 31.05.2027' },
        { date: '2027-04', title: 'Summer term projects listed', tag: 'expected', note: 'LFX docs: mid-April' },
        { date: '2027-06-01', title: 'Summer term starts', tag: 'expected', note: 'Runs to 31.08.2027' },
        { date: '2027-07', title: 'Fall term projects listed', tag: 'expected', note: 'LFX docs: mid-July' },
        { date: '2027-09-01', title: 'Fall term starts', tag: 'expected', note: 'Runs to 30.11.2027' }
      ]
    },

    sob: {
      id: 'sob',
      short: 'Summer of Bitcoin',
      title: 'Summer of Bitcoin 2027',
      name: 'Summer of Bitcoin',
      page: 'sob.html',
      site: 'https://www.summerofbitcoin.org',
      milestones: [
        'Learn Bitcoin basics',
        'Apply on the website',
        'Finish the challenge round',
        'Pick an org and project',
        'Set up locally',
        'First PR merged',
        'Write the proposal',
        'Submit the proposal'
      ],
      timeline: [
        { date: '2026-11', title: 'Learn Bitcoin basics', tag: 'proposed', note: '' },
        { date: '2027-02', title: 'Applications open', tag: 'expected', note: '2026 applications opened in February' },
        { date: '2027-03', title: 'Challenge round', tag: 'expected', note: 'Month is a guess' },
        { date: '2027-04', title: 'Proposal round', tag: 'expected', note: 'Month is a guess' },
        { date: '2027-05', title: 'Project starts', tag: 'expected', note: '2026: 18.05.2026' },
        { date: '2027-08', title: 'Project ends', tag: 'expected', note: '2026: 16.08.2026' }
      ]
    },
    outreachy: {
      id: 'outreachy',
      short: 'Outreachy',
      title: 'Outreachy 2027',
      name: 'Outreachy (May cohort)',
      page: 'outreachy.html',
      site: 'https://www.outreachy.org',
      milestones: [
        'Read the eligibility rules',
        'Submit the initial application',
        'Initial application approved',
        'Pick a project from the project list',
        'Make my first contribution',
        'Record each contribution on the Outreachy site',
        'Write the final application',
        'Submit before the final deadline'
      ],
      timeline: [
        { date: '2026-11', title: 'Read the eligibility rules', tag: 'proposed', note: 'There is also a December cohort, mainly for southern hemisphere students.' },
        { date: '2027-02', title: 'Initial applications open', tag: 'expected', note: '2026: open 06.02.2026, closed 13.02.2026' },
        { date: '2027-03', title: 'Initial results and contribution period starts', tag: 'expected', note: '2026: 20.03.2026' },
        { date: '2027-04', title: 'Final application deadline', tag: 'expected', note: '2026: 15.04.2026' },
        { date: '2027-05', title: 'Accepted interns announced', tag: 'expected', note: '2026: 01.05.2026' },
        { date: '2027-05', title: 'Internship starts', tag: 'expected', note: '2026: 18.05.2026 to 17.08.2026' }
      ]
    },

    fossee: {
      id: 'fossee',
      short: 'IIT Bombay',
      title: 'FOSSEE 2027',
      name: 'FOSSEE Summer Fellowship (IIT Bombay)',
      page: 'fossee.html',
      site: 'https://fossee.in',
      milestones: [
        'Browse the FOSSEE projects',
        'Pick a project',
        'Learn the tool the project uses',
        'Do the screening task',
        'Submit the application',
        'Check the results',
        'Choose remote or on-campus',
        'Finish the fellowship'
      ],
      timeline: [
        { date: '2026-11', title: 'Learn the tools for my chosen project', tag: 'proposed', note: '' },
        { date: '2027-03', title: 'Applications open', tag: 'expected', note: '2026: 27.03.2026' },
        { date: '2027-04', title: 'Applications and screening task close', tag: 'expected', note: '2026: 13.04.2026' },
        { date: '2027-04', title: 'Results announced', tag: 'expected', note: '2026: 20.04.2026' },
        { date: '2027-05', title: 'Fellowship starts', tag: 'expected', note: '2026: 15.05.2026 to 15.07.2026, remote or on-campus, no stipend' }
      ]
    },

    fossoverflow: {
      id: 'fossoverflow',
      short: 'IIT Bhilai',
      title: 'FOSS Overflow 2027',
      name: 'FOSS Overflow (OpenLake, IIT Bhilai)',
      page: 'fossoverflow.html',
      site: 'https://fossoverflow.openlake.in',
      milestones: [
        'Join the OpenLake Discord',
        'Check the rules (18+, Git and GitHub basics)',
        'Register',
        'Pick a project',
        'Set up locally',
        'First PR merged',
        'Keep 30 hours a week free for the 4 week coding period',
        'Finish the coding period'
      ],
      timeline: [
        { date: '2026-11', title: 'Learn Git and GitHub basics', tag: 'proposed', note: '' },
        { date: '2027-01', title: 'Next edition', tag: 'expected', note: 'Dates not announced. Check fossoverflow.openlake.in or the Discord.' }
      ]
    }
  };
})(window.App);
