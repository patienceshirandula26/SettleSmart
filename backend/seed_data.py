"""Reference data for SettleSmart.

These lists are the "content" of the app — the settlement categories, the
standard checklist tasks, the official links, and the documents every new
student starts with. init_db.py loads them into MySQL, and app.py re-uses
STARTER_DOCUMENTS when a brand new account is created.
"""

# (category_id, name, description, emoji, sort_order)
CATEGORIES = [
    (1, "Identity & Study", "Student ID, USI, passport and visa documents", "🎓", 1),
    (2, "Financial", "TFN, bank account, bank card and money setup", "💼", 2),
    (3, "Transport & Licensing", "Go Card and international driver licence verification", "🚆", 3),
    (4, "Health", "OSHC details and emergency contacts", "🏥", 4),
    (5, "Accommodation", "Rental documents, bond and housing setup", "🏠", 5),
    (6, "Work Clearances", "Blue Card, Yellow Card and Red Card if required", "🪪", 6),
    (7, "Communication", "Australian SIM card and mobile number setup", "📱", 7),
    (8, "Employment", "Resume, LinkedIn and job-ready documents", "💻", 8),
]

# (task_id, category_id, name, description, estimated_time, official_link,
#  priority, due_offset_days, sort_order)
#
# due_offset_days is how many days after arrival (or after signing up, if no
# arrival date is set) the task should be finished.
TASKS = [
    (1, 1, "Apply for USI", "Create your Unique Student Identifier", "10 minutes",
     "https://www.usi.gov.au/", "High", 7, 1),
    (2, 1, "Collect Student ID", "Collect your university student ID card", "15 minutes",
     None, "Medium", 14, 2),
    (3, 2, "Apply for TFN", "Apply for a Tax File Number", "15 minutes",
     "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn", "High", 7, 1),
    (4, 2, "Open Bank Account", "Open an Australian bank account", "30 minutes",
     None, "High", 10, 2),
    (5, 2, "Receive Bank Card", "Collect your debit card", "7 days",
     None, "Medium", 21, 3),
    (6, 3, "Purchase Go Card", "Buy a Go Card for public transport", "10 minutes",
     "https://translink.com.au/tickets-and-fares/go-card", "Medium", 10, 1),
    (7, 3, "Verify International Driver Licence", "Check if your overseas licence can be used", "20 minutes",
     "https://www.qld.gov.au/transport/licensing/driver-licences/overseas-licences", "Low", 60, 2),
    (8, 4, "Activate OSHC", "Check and activate your Overseas Student Health Cover", "15 minutes",
     "https://www.studyaustralia.gov.au/en/plan-your-studies/overseas-student-health-cover-oshc", "High", 5, 1),
    (9, 5, "Upload Rental Agreement", "Store a copy of your rental agreement", "10 minutes",
     None, "Medium", 21, 1),
    (10, 6, "Apply for Blue Card", "If required for child-related employment", "20 minutes",
     "https://www.qld.gov.au/law/laws-regulated-industries-and-accountability/queensland-laws-and-regulations/regulated-industries-and-licensing/blue-card", "Low", 45, 1),
    (11, 6, "Apply for Yellow Card", "NDIS Worker Screening if required", "20 minutes",
     "https://www.workerscreening.qld.gov.au/", "Low", 45, 2),
    (12, 6, "Apply for Red Card", "Construction industry induction if required", "20 minutes",
     None, "Low", 45, 3),
    (13, 7, "Purchase Australian SIM Card", "Buy and activate an Australian SIM card", "20 minutes",
     None, "High", 3, 1),
    (14, 8, "Create Resume", "Prepare an Australian-style resume", "1 hour",
     None, "Medium", 30, 1),
    (15, 8, "Create LinkedIn Profile", "Create or update your LinkedIn profile", "45 minutes",
     None, "Low", 40, 2),
    (16, 1, "Organise Passport & Visa Copies", "Keep digital and physical copies of both", "15 minutes",
     None, "High", 3, 3),
    (17, 4, "Set Up Emergency Contacts", "Save local emergency and university contacts", "10 minutes",
     None, "Medium", 14, 2),
    (18, 5, "Set Up Home Internet", "Arrange internet at your accommodation", "30 minutes",
     None, "Low", 30, 2),
    (19, 2, "Set Up Superannuation", "Open a super account before you start working", "30 minutes",
     None, "Medium", 45, 4),
]

# (resource_id, category_id, name, description, official_link, emoji)
RESOURCES = [
    (1, 1, "Unique Student Identifier",
     "Official website for creating or finding a USI number.",
     "https://www.usi.gov.au/", "🎓"),
    (2, 2, "Australian Taxation Office - TFN",
     "Official website for applying for a Tax File Number.",
     "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn", "🏛️"),
    (3, 3, "Translink Go Card",
     "Official information for Go Card public transport setup in Queensland.",
     "https://translink.com.au/tickets-and-fares/go-card", "🚆"),
    (4, 3, "Queensland Overseas Licence Information",
     "Information about using or verifying an overseas driver licence in Queensland.",
     "https://www.qld.gov.au/transport/licensing/driver-licences/overseas-licences", "🚗"),
    (5, 6, "Blue Card Services",
     "Official Queensland Government information for Blue Card applications.",
     "https://www.qld.gov.au/law/laws-regulated-industries-and-accountability/queensland-laws-and-regulations/regulated-industries-and-licensing/blue-card", "🪪"),
    (6, 6, "NDIS Worker Screening",
     "Official Queensland Worker Screening information for disability-related work.",
     "https://www.workerscreening.qld.gov.au/", "🧡"),
    (7, 4, "OSHC Information",
     "Overseas Student Health Cover explained for international students.",
     "https://www.studyaustralia.gov.au/en/plan-your-studies/overseas-student-health-cover-oshc", "🏥"),
    (8, 4, "Medicare / Services Australia",
     "Health services and payments available in Australia.",
     "https://www.servicesaustralia.gov.au/medicare", "💊"),
    (9, 1, "Department of Home Affairs",
     "Check your visa conditions, working hours and reporting duties.",
     "https://www.homeaffairs.gov.au", "🛂"),
    (10, 8, "Study Queensland",
     "Student support, events and job-readiness programs in Queensland.",
     "https://studyqueensland.qld.gov.au", "🌏"),
    (11, 5, "Queensland Residential Tenancies Authority",
     "Your rights as a renter, bond lodgement and dispute help.",
     "https://www.rta.qld.gov.au/", "🏠"),
    (12, 7, "Australian Communications Guide",
     "Comparing Australian mobile and internet providers.",
     "https://www.accc.gov.au/consumers/internet-and-phone", "📱"),
    (13, 2, "myGov Account",
     "Create the myGov account that links the ATO, Medicare and Centrelink.",
     "https://my.gov.au", "🔐"),
    (14, 2, "Link the ATO to myGov",
     "Step-by-step guide to linking the Australian Taxation Office to myGov.",
     "https://www.ato.gov.au/online-services/online-services-for-individuals-and-sole-traders/how-to-create-a-mygov-account-and-link-to-the-ato", "🏛️"),
    (15, 8, "Fair Work Ombudsman",
     "Your pay, working hours and rights as an international student.",
     "https://www.fairwork.gov.au/find-help-for/visa-holders-and-migrants", "⚖️"),
    (16, 4, "healthdirect",
     "Free health advice line and symptom checker, available 24 hours.",
     "https://www.healthdirect.gov.au/", "🩺"),
    (17, 1, "Study Australia",
     "Official guide for international students, from arrival to graduation.",
     "https://www.studyaustralia.gov.au/", "📘"),
]

# Documents every new student starts with. They begin as "Pending" with no
# file attached; the student uploads the real file from the Documents page.
# (document_name, document_type/category, provider, notes)
STARTER_DOCUMENTS = [
    ("Passport & Visa Copy", "Identity & Study", "Department of Home Affairs",
     "Keep a scanned copy of your passport photo page and visa grant"),
    ("USI Number", "Identity & Study", "USI Registry",
     "Required for study and training records"),
    ("Student ID Card", "Identity & Study", "Your university",
     "Collect from campus student services"),
    ("Tax File Number", "Financial", "Australian Taxation Office",
     "Required for employment and tax purposes"),
    ("Bank Card", "Financial", "Your bank",
     "Upload a photo once your debit card arrives"),
    ("Go Card", "Transport & Licensing", "Translink",
     "Used for public transport in Queensland"),
    ("International Driver Licence Verification", "Transport & Licensing", "Queensland Transport",
     "Verify your overseas licence if you plan to drive"),
    ("OSHC Details", "Health", "Your health cover provider",
     "Upload your health cover certificate"),
    ("Rental Agreement", "Accommodation", "Your landlord or agent",
     "Store your signed lease and bond receipt"),
    ("Australian SIM Card", "Communication", "Your mobile provider",
     "Record your new Australian mobile number"),
    ("Blue Card", "Work Clearances", "Queensland Government",
     "Only required for child-related work"),
    ("Yellow Card", "Work Clearances", "NDIS Worker Screening",
     "Only required for disability support work"),
]

# Reminders created for a brand new account, as (task_id, days_from_now).
STARTER_REMINDERS = [
    (13, 3, "Communication"),   # SIM card
    (8, 5, "Health"),           # OSHC
    (1, 7, "Identity & Study"),  # USI
    (3, 7, "Financial"),        # TFN
]
