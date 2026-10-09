// Single source for the menu, the tool header and the About panel.
// sample.num lists the right-aligned (numeric) columns, 0-based.
// items fixes the menu order; wide cards span two columns.
var GROUPS = [
  { id: 'ops', title: 'Operations', cols: 2, items: ['/onboarding-decks', '/audience-tracker'] },
  { id: 'discover', title: 'Discovery', cols: 2, items: ['/taxonomy', '/survey-conversion'] },
  { id: 'analysis', title: 'Analysis', cols: 3, items: ['/geo', '/streamed-media', '/cross-impute', '/dmp-insights', '/1p-modeling'], wide: ['/geo'] }
];

// Geo Analysis is one menu entry with three engines: pick a country, then (Canada) a level.
var GEO_MODES = [
  { route: '/geo/us', page: '/us-geo', country: 'us', level: null },
  { route: '/geo/ca/fsa', page: '/ca-geo', country: 'ca', level: 'fsa' },
  { route: '/geo/ca/fsaldu', page: '/ca-geo-fsaldu', country: 'ca', level: 'fsaldu' }
];

var TOOLS = [
  {
    route: '/onboarding-decks', group: 'ops', icon: '📋', accent: '#38bdf8', tag: 'People',
    title: 'Onboarding', blurb: 'Per-employee onboarding board with linked decks.',
    about: {
      what: 'A kanban board for each new hire. Tasks move between To do, In progress and Done, and each task can link to a training deck.',
      steps: ['Pick an employee, or add one from a template.', 'Drag tasks between columns; progress updates automatically.', 'Attach deck links and save the board as a reusable template.'],
      sample: { caption: 'Progress by employee',
        cols: ['Employee', 'To do', 'In progress', 'Done', 'Complete'], num: [1, 2, 3, 4],
        rows: [['Jordan Avery', 3, 2, 9, '64%'], ['Priya Castellano', 8, 4, 5, '29%'], ['Mateo Lindqvist', 9, 1, 0, '0%'], ['Hana Okafor', 5, 3, 7, '47%']] }
    }
  },
  {
    route: '/audience-tracker', group: 'ops', icon: '📡', accent: '#fbbf24', tag: 'Finance',
    title: 'Audience & Campaign Tracker', blurb: 'Agencies, clients, audiences and campaign fees.',
    about: {
      what: 'Tracks every audience a client has activated and prices each campaign from the agency rate card, with client-level overrides. Creation fees are waived for 12 months after the last one is paid, and campaigns priced at old rates are flagged.',
      steps: ['Add an agency with its rate card, then its clients and audiences.', 'Add a campaign: start date, length and platform impressions.', 'Fees are priced live: creation, syndication and data usage.'],
      sample: { caption: 'Campaign fees',
        cols: ['Campaign', 'Platforms', 'Months', 'Creation', 'Syndication', 'Data usage', 'Total'], num: [1, 2, 3, 4, 5, 6],
        rows: [['Spring Launch', 2, 3, '$1,500.00', '$1,260.00', '$1,800.00', '$4,560.00'], ['Summer Always-On', 1, 2, 'Waived', '$420.00', '$675.00', '$1,095.00'], ['Loyalty Retarget (1P)', 3, 1, '$1,500.00', '$262.50', '$600.00', '$2,362.50']],
        note: 'Syndication = records × platforms × months × rate ÷ 1,000. Data usage = impressions × rate ÷ 1,000.' }
    }
  },
  {
    route: '/taxonomy', group: 'discover', icon: '🔍', accent: '#fb923c', tag: 'Search',
    title: 'Taxonomy Search', blurb: 'Find audience segments by keyword or meaning.',
    about: {
      what: 'Searches panel, census and purchase taxonomies at once. Results are tiered: Exact, Contains, In description, then semantically Related. Keyword search works immediately; semantic search switches on once the model has loaded.',
      steps: ['Type a need, such as “luxury travel”.', 'Filter by source and scan the match tier and relevance.', 'Export the results to Excel.'],
      sample: { caption: 'Search: “luxury travel”',
        cols: ['Attribute', 'Source', 'Match', 'Relevance'], num: [3],
        rows: [['Luxury Travel', 'Panel · CA Interest', 'Exact', '100'], ['CB_SPEND_TRAVEL', 'Census · Spending', 'Related', '100'], ['Luxury Fashion Buyer', 'Purchase · Apparel', 'Related', '100'], ['Prestige Beauty Buyer', 'Purchase · Beauty', 'Related', '88.6'], ['Wine Enthusiast', 'Purchase · Beverage', 'Related', '79.6']] }
    }
  },
  {
    route: '/survey-conversion', group: 'discover', icon: '🔄', accent: '#e879f9', tag: 'Conversion',
    title: 'Survey → CA Taxonomy', blurb: 'Map a survey audience to Canadian segments.',
    about: {
      what: 'Reads a survey audience-definition export and maps every survey attribute to Canadian taxonomy segments. Matches come from a live taxonomy search and a reference crosswalk. Reference-only matches that no longer exist are flagged.',
      steps: ['Upload the survey audience export (.xlsx).', 'Review matches by group, with AND / OR logic preserved.', 'Download the mapping workbook.'],
      sample: { caption: 'Mapped segments',
        cols: ['Survey attribute', 'CA segment', 'Source', 'In taxonomy'],
        rows: [['Fitness', 'CA Interest - Fitness Enthusiasts', 'Taxonomy', 'Yes'], ['Eco-Conscious', 'CA Lifestyle - Green Living', 'Reference', 'Yes'], ['Eco-Conscious', 'CA Lifestyle - Eco Shoppers 2024', 'Reference', 'No'], ['Tech Savvy', 'CA Lifestyle - Early Adopters', 'Reference', 'Yes'], ['Parent', 'CA Lifestyle - Busy Parents', 'Reference', 'Yes']] }
    }
  },
  {
    route: '/streamed-media', group: 'analysis', icon: '🎧', accent: '#ff5a63', tag: 'Media',
    title: 'Streamed Media Analysis', blurb: 'What people watch and hear, and what they might buy.',
    about: {
      what: 'Reads ComScore beacon URLs, finds the content behind each one on YouTube, Netflix, Prime Video, Instagram Reels, Spotify Music and Spotify Podcasts, and pulls title, genre, synopsis, duration and release date. Interests are then rolled up per panelist to infer which products and brands they are likely to buy.',
      steps: ['Paste ComScore URLs, one per line.', 'Analyze: every URL resolves to a platform and title.', 'Pick a panelist to see interests, likely purchases and the titles behind them.'],
      sample: { caption: 'Panelist P10017 · one insight per platform',
        cols: ['Platform', 'Watched / listened to', 'Likely customer for', 'Confidence'], num: [3],
        rows: [['Spotify Podcasts', 'The Compound Interest Hour', 'Robo-advisor · Northpeak Invest', '50%'], ['YouTube', 'Sub-3 Marathon: The 16-Week Build', 'Running shoes · Strideline', '50%'], ['Spotify Music', 'Brass & Bramble (Workout Mix)', 'Gym membership · Brightside Fitness', '96%'], ['Instagram Reels', '5-minute desk stretch routine', 'Standing desk · Elevate Desks', '50%'], ['Netflix', 'Pocketful of Thunder', 'Performance EV · Velocity Motors', '50%'], ['Prime Video', 'Ironbark Rescue', 'Outdoor gear · Trailhead Outfitters', '50%']],
        note: 'Brands are fictional. Confidence grows with every title that points to the same interest.' }
    }
  },
  {
    route: '/ca-geo', group: 'geo', icon: '🍁', accent: '#2dd4bf', tag: 'Geography',
    title: 'CA Geo Analysis · FSA', blurb: 'Index an audience across Canadian FSAs, with map.',
    about: {
      what: 'Takes audience counts by FSA and compares them with the national mix across demographics, spend, media, financial and wealth datasets. An index of 100 matches the nation; above 120 is over-indexed.',
      steps: ['Choose FSAs by upload, cluster, province or city.', 'Generate the index workbook, one tab per dataset.', 'Map any trait by FSA and search brand locations.'],
      sample: { caption: 'Demographics tab',
        cols: ['Variable', 'Description', 'Nat. %', 'Audience %', 'Index'], num: [2, 3, 4],
        rows: [['Population Aged 25 to 34', '', '14.0', '17.2', '122.9'], ['Households Income $125,000+', '', '12.0', '15.6', '130.0'], ['University Degree Holders', '', '24.0', '28.8', '120.0'], ['Renter Households', '', '12.0', '9.6', '80.0'], ['Population Aged 65 and Over', '', '19.0', '13.3', '70.0']] }
    }
  },
  {
    route: '/ca-geo-fsaldu', group: 'geo', icon: '📮', accent: '#2dd4bf', tag: 'Geography',
    title: 'CA Geo Analysis · FSALDU', blurb: 'Index at full six-character postal code level.',
    about: {
      what: 'Joins a client audience table to demographic tables on six-character postal codes straight from the warehouse. Keys are normalised, empty traits are dropped, and averages are weighted correctly.',
      steps: ['Connect to the warehouse and choose the audience table.', 'Check the join, then pick datasets and geography.', 'Run the report and download the workbook.'],
      sample: { caption: 'Households tab',
        cols: ['Variable', 'Description', 'Nat. %', 'Audience %', 'Index'], num: [2, 3, 4],
        rows: [['HHINC150', 'Households with income $150,000 or over', '18.0', '25.2', '140.0'], ['EDUUNI', 'Population 25+ with a university degree', '28.0', '33.6', '120.0'], ['DWAPT5', 'Dwellings in apartment buildings of 5+ storeys', '17.0', '23.8', '140.0'], ['FDORG', 'Households buying organic food', '36.0', '43.2', '120.0'], ['COMCAR', 'Workers commuting by car, truck or van', '70.0', '56.0', '80.0']] }
    }
  },
  {
    route: '/us-geo', group: 'geo', icon: '🗺️', accent: '#60a5fa', tag: 'Geography',
    title: 'US Geo Analysis', blurb: 'Tier ZIPs and de-duplicate segments.',
    about: {
      what: 'Turns an audience export into a ZIP report. Each ZIP is indexed against its state, then tiered Priority, Efficiency, Scale, Marginal or Suppress. A second step compares several segments and removes ZIPs that more than one segment claims.',
      steps: ['Upload the audience export (.xlsx) and preview the tiers.', 'Download the ZIP report.', 'Upload two or more reports to differentiate segments.'],
      sample: { caption: 'Tier summary',
        cols: ['Tier', 'ZIPs', 'Target', '% of target', 'Avg state index'], num: [1, 2, 3, 4],
        rows: [['Priority', '142', '48,300', '21.4%', '168.2'], ['Efficiency', '310', '61,900', '27.4%', '133.5'], ['Scale', '186', '74,800', '33.1%', '108.9'], ['Marginal', '402', '31,200', '13.8%', '91.7'], ['Suppress', '360', '9,700', '4.3%', '62.4']],
        note: 'Priority needs index ≥ 150 and 100+ people. Efficiency ≥ 120 and 50+. Scale ≥ 100 and 500+. Marginal ≥ 80.' }
    }
  },
  {
    route: '/cross-impute', group: 'analysis', icon: '🧬', accent: '#3fb950', tag: 'Data',
    title: '1P · 2P Cross Impute', blurb: 'Merge two ID datasets and fill the gaps.',
    about: {
      what: 'Outer-joins a first-party file and a survey file on REAL_ID, flags each ID as 1P only, survey only or overlap, resolves clashing columns, and imputes the gaps. Behavioural fields prefer 1P, attitudes prefer the survey, and demographic clashes are counted for review.',
      steps: ['Upload the 1P and survey CSVs.', 'Choose which source wins clashes and the imputation method: segment median or mode, or KNN.', 'Download the merged file or any segment.'],
      sample: { caption: 'Merge summary',
        cols: ['Segment', 'IDs', 'Share'], num: [1, 2],
        rows: [['Overlap', '32', '23.5%'], ['1P only', '58', '42.6%'], ['Survey only', '46', '33.8%']],
        note: '136 IDs in total. Missing values fall to 0% after imputation, and every filled value is marked “imputed” in a _source column.' }
    }
  },
  {
    route: '/dmp-insights', group: 'analysis', icon: '📈', accent: '#60a5fa', tag: 'Insights',
    title: 'DMP Insights', blurb: 'Consolidate DMP trait exports.',
    about: {
      what: 'Reads one or more DMP insight exports and merges duplicate traits reported by different data sources. Index is composition-weighted, composition is scaled to unique users, and traits whose sources disagree sharply are flagged.',
      steps: ['Upload the .xlsx exports, or use the sample data.', 'Filter by category and sort by index.', 'Download the summary workbook.'],
      sample: { caption: 'Consolidated traits',
        cols: ['Category', 'Trait', 'Sources', 'Index', 'Comp. %', 'Flag'], num: [2, 3, 4],
        rows: [['Interests', 'Hardcore Gamer', 2, '214', '3.9', ''], ['Interests', 'Esports Viewer', 2, '197', '2.8', ''], ['Interests', 'Shooter Games', 3, '188', '9.1', ''], ['Interests', 'Handheld Console', 3, '168', '6.2', 'Sources disagree'], ['Demographics', 'Age 18-24', 2, '176', '14.8', '']] }
    }
  },
  {
    route: '/1p-modeling', group: 'analysis', icon: '🧠', accent: '#a78bfa', tag: 'Warehouse',
    title: '1P Modelling', blurb: 'Lookalike models and clusters from warehouse data.',
    about: {
      what: 'Browses first-party tables in the warehouse, then builds a lookalike model from a client list. Candidate traits are ranked, the top ones are scored, and every ID is bucketed into deciles. It can also profile audiences by taxonomy and cluster them with k-means.',
      steps: ['Connect and pick the base table and the client table.', 'Test the join, then build the lookalike model.', 'Export scores, decile insights or cluster profiles.'],
      sample: { caption: 'Top model features',
        cols: ['Feature', 'Importance', 'Coefficient'], num: [1, 2],
        rows: [['Vehicle Intent > EV Intender', '0.071', '+0.84'], ['Outdoor Activities > Hiking', '0.058', '+0.61'], ['Travel > International Trips', '0.052', '+0.47'], ['Household Income > $150K+', '0.044', '+0.39'], ['Streaming Video > Heavy', '0.031', '-0.22']],
        note: 'Reported with AUC and lift in the top 1%, 5% and 10% of scores.' }
    }
  }
,
  {
    route: '/geo', group: 'analysis', icon: '🌎', accent: '#2dd4bf', tag: 'Geography',
    title: 'Geo Analysis', blurb: 'Index an audience by US ZIP or Canadian postal geography.'
  }
];
