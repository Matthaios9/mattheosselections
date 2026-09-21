/**
 * Privacy policy, per language. Written from what the site actually does (orders via Kustom Checkout,
 * customer accounts, back-in-stock emails, newsletter, only essential cookies) — review it with the
 * client before relying on it legally. Rendered by LegalDocument (src/components/legal).
 */

const en = {
  eyebrow: 'Legal',
  title: 'Privacy Policy',
  updated: 'Last updated: 21 September 2026',
  contents: 'Contents',
  sections: [
    {
      id: 'controller',
      title: 'Who is responsible for your data',
      blocks: [
        'Mattheos Selections is run by Pasver AB, which is the controller for the personal data described in this policy.',
        { lines: ['Pasver AB', 'Org. no. 559053-2486', 'Ekfatsgatan 4', '117 57 Stockholm, Sweden'] },
        'For any question about your personal data, email us at info@mattheosselections.com.',
      ],
    },
    {
      id: 'data',
      title: 'What we collect and why',
      blocks: [
        { heading: 'When you place an order' },
        'We collect your name, email address, phone number, delivery and billing address and the details of your order. We use them to deliver your order, send you order and shipping updates, handle returns and complaints, and keep the accounting records the law requires. Legal basis: performance of our contract with you, and our legal obligations under Swedish accounting law.',
        { heading: 'When you create an account' },
        'We store your name, email address and a password (only in encrypted form, which we can never read), so that you can log in and see your orders. Legal basis: performance of our contract with you.',
        { heading: 'When you ask to be notified' },
        'If you ask us to email you when a sold-out product is back in stock, we store your email address and the product until we have sent that email. Legal basis: your consent, which you can withdraw at any time.',
        { heading: 'When you subscribe to our newsletter' },
        'If you sign up for our newsletter, we use your email address to send you news and offers. Every email has a link to unsubscribe. Legal basis: your consent.',
        { heading: 'When you contact us' },
        'If you email us or use the contact form, we use your name, email address and message to answer you. Legal basis: our legitimate interest in answering your questions.',
      ],
    },
    {
      id: 'payment',
      title: 'Payment',
      blocks: [
        'Payments are handled by Kustom through Kustom Checkout. Your card or bank details are entered directly with Kustom and never reach us. Kustom processes the information needed for the payment under its own privacy notice.',
      ],
    },
    {
      id: 'sharing',
      title: 'Who we share your data with',
      blocks: [
        'We never sell your personal data. We only share it with companies that help us run the shop, and only as much as they need:',
        {
          list: [
            'Kustom, for payment.',
            'The carrier that delivers your parcel (name, address, phone number and email for delivery updates).',
            'Our hosting, database and email providers, who store and process data on our behalf under a data processing agreement.',
          ],
        },
        'We may also disclose data when the law requires it, for example to the Swedish Tax Agency.',
      ],
    },
    {
      id: 'transfers',
      title: 'Transfers outside the EU',
      blocks: [
        'Some of our service providers are based outside the EU/EEA. When personal data is transferred there, we make sure it is protected by an adequacy decision of the European Commission, such as the EU–US Data Privacy Framework, or by the Commission’s standard contractual clauses.',
      ],
    },
    {
      id: 'retention',
      title: 'How long we keep your data',
      blocks: [
        {
          list: [
            'Orders and receipts: seven years, as required by the Swedish Bookkeeping Act (bokföringslagen).',
            'Your account: until you ask us to delete it. Orders you have placed are still kept for as long as the law requires.',
            'Back-in-stock requests: until we have emailed you, or until you ask us to remove them.',
            'Newsletter: until you unsubscribe.',
            'Emails and messages: as long as needed to answer and follow up on your question.',
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and local storage',
      blocks: [
        'We only use what the website needs to work. We do not use cookies for analytics or advertising.',
        {
          list: [
            'ms_session — keeps you logged in (7 days, or 30 days if you choose to stay logged in).',
            'NEXT_LOCALE — remembers the language you chose (1 year).',
            'Your cart and wishlist are saved in your browser’s local storage, on your device only.',
          ],
        },
        'Kustom Checkout may set its own cookies that are needed to complete the payment.',
      ],
    },
    {
      id: 'rights',
      title: 'Your rights',
      blocks: [
        'Under the GDPR you have the right to:',
        {
          list: [
            'get a copy of the personal data we hold about you,',
            'have incorrect data corrected,',
            'have your data deleted, unless the law requires us to keep it,',
            'restrict or object to how we use it,',
            'receive your data in a machine-readable format (data portability), and',
            'withdraw your consent at any time, where we rely on consent.',
          ],
        },
        'Email us at info@mattheosselections.com to use any of these rights. We answer within one month.',
        'If you are unhappy with how we handle your data, you can complain to the Swedish Authority for Privacy Protection (Integritetsskyddsmyndigheten, IMY) at imy.se.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      blocks: [
        'We may update this policy when our services or the law change. The latest version is always on this page, with the date it was last updated.',
      ],
    },
  ],
};

const sv = {
  eyebrow: 'Juridiskt',
  title: 'Integritetspolicy',
  updated: 'Senast uppdaterad: 21 september 2026',
  contents: 'Innehåll',
  sections: [
    {
      id: 'controller',
      title: 'Personuppgiftsansvarig',
      blocks: [
        'Mattheos Selections drivs av Pasver AB, som är personuppgiftsansvarig för de personuppgifter som beskrivs i den här policyn.',
        { lines: ['Pasver AB', 'Org.nr 559053-2486', 'Ekfatsgatan 4', '117 57 Stockholm'] },
        'Har du frågor om dina personuppgifter är du välkommen att mejla oss på info@mattheosselections.com.',
      ],
    },
    {
      id: 'data',
      title: 'Vilka uppgifter vi samlar in och varför',
      blocks: [
        { heading: 'När du lägger en beställning' },
        'Vi samlar in ditt namn, din e-postadress, ditt telefonnummer, din leverans- och fakturaadress samt uppgifter om din beställning. Vi använder dem för att leverera din beställning, skicka order- och leveransbesked, hantera returer och reklamationer och föra den bokföring som lagen kräver. Rättslig grund: fullgörande av vårt avtal med dig och våra rättsliga skyldigheter enligt bokföringslagen.',
        { heading: 'När du skapar ett konto' },
        'Vi sparar ditt namn, din e-postadress och ett lösenord (endast i krypterad form, som vi aldrig kan läsa) så att du kan logga in och se dina beställningar. Rättslig grund: fullgörande av vårt avtal med dig.',
        { heading: 'När du vill bli meddelad' },
        'Om du ber oss mejla dig när en slutsåld produkt finns i lager igen sparar vi din e-postadress och produkten tills vi har skickat det mejlet. Rättslig grund: ditt samtycke, som du kan återkalla när som helst.',
        { heading: 'När du prenumererar på vårt nyhetsbrev' },
        'Om du anmäler dig till vårt nyhetsbrev använder vi din e-postadress för att skicka nyheter och erbjudanden. Varje utskick innehåller en länk för att avsluta prenumerationen. Rättslig grund: ditt samtycke.',
        { heading: 'När du kontaktar oss' },
        'Om du mejlar oss eller använder kontaktformuläret använder vi ditt namn, din e-postadress och ditt meddelande för att svara dig. Rättslig grund: vårt berättigade intresse av att besvara dina frågor.',
      ],
    },
    {
      id: 'payment',
      title: 'Betalning',
      blocks: [
        'Betalningar hanteras av Kustom via Kustom Checkout. Dina kort- eller bankuppgifter anges direkt hos Kustom och når aldrig oss. Kustom behandlar de uppgifter som behövs för betalningen enligt sin egen integritetspolicy.',
      ],
    },
    {
      id: 'sharing',
      title: 'Vilka vi delar dina uppgifter med',
      blocks: [
        'Vi säljer aldrig dina personuppgifter. Vi delar dem bara med företag som hjälper oss att driva butiken, och bara i den mån de behöver:',
        {
          list: [
            'Kustom, för betalningen.',
            'Transportföretaget som levererar ditt paket (namn, adress, telefonnummer och e-post för leveransbesked).',
            'Våra leverantörer av webbhotell, databas och e-post, som lagrar och behandlar uppgifter för vår räkning enligt ett personuppgiftsbiträdesavtal.',
          ],
        },
        'Vi kan också lämna ut uppgifter när lagen kräver det, till exempel till Skatteverket.',
      ],
    },
    {
      id: 'transfers',
      title: 'Överföring utanför EU',
      blocks: [
        'Vissa av våra leverantörer finns utanför EU/EES. När personuppgifter överförs dit ser vi till att de skyddas genom ett beslut från EU-kommissionen om adekvat skyddsnivå, till exempel EU–US Data Privacy Framework, eller genom kommissionens standardavtalsklausuler.',
      ],
    },
    {
      id: 'retention',
      title: 'Hur länge vi sparar dina uppgifter',
      blocks: [
        {
          list: [
            'Beställningar och kvitton: i sju år, enligt bokföringslagen.',
            'Ditt konto: tills du ber oss radera det. Beställningar du har gjort sparas ändå så länge lagen kräver.',
            'Bevakningar av slutsålda produkter: tills vi har mejlat dig, eller tills du ber oss ta bort dem.',
            'Nyhetsbrev: tills du avslutar prenumerationen.',
            'Mejl och meddelanden: så länge som behövs för att besvara och följa upp din fråga.',
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies och lokal lagring',
      blocks: [
        'Vi använder bara det som webbplatsen behöver för att fungera. Vi använder inga cookies för statistik eller marknadsföring.',
        {
          list: [
            'ms_session – håller dig inloggad (7 dagar, eller 30 dagar om du väljer att förbli inloggad).',
            'NEXT_LOCALE – kommer ihåg vilket språk du har valt (1 år).',
            'Din varukorg och önskelista sparas i webbläsarens lokala lagring, endast på din enhet.',
          ],
        },
        'Kustom Checkout kan sätta egna cookies som behövs för att genomföra betalningen.',
      ],
    },
    {
      id: 'rights',
      title: 'Dina rättigheter',
      blocks: [
        'Enligt dataskyddsförordningen (GDPR) har du rätt att:',
        {
          list: [
            'få en kopia av de personuppgifter vi har om dig,',
            'få felaktiga uppgifter rättade,',
            'få dina uppgifter raderade, om vi inte måste spara dem enligt lag,',
            'begränsa eller invända mot hur vi använder dem,',
            'få ut dina uppgifter i ett maskinläsbart format (dataportabilitet), och',
            'när som helst återkalla ditt samtycke, där vi behandlar uppgifter med stöd av samtycke.',
          ],
        },
        'Mejla oss på info@mattheosselections.com för att använda någon av dessa rättigheter. Vi svarar inom en månad.',
        'Om du är missnöjd med hur vi hanterar dina uppgifter kan du lämna klagomål till Integritetsskyddsmyndigheten (IMY), imy.se.',
      ],
    },
    {
      id: 'changes',
      title: 'Ändringar i policyn',
      blocks: [
        'Vi kan uppdatera den här policyn när våra tjänster eller lagen ändras. Den senaste versionen finns alltid på den här sidan, tillsammans med datumet för den senaste uppdateringen.',
      ],
    },
  ],
};

const el = {
  eyebrow: 'Νομικά',
  title: 'Πολιτική απορρήτου',
  updated: 'Τελευταία ενημέρωση: 21 Σεπτεμβρίου 2026',
  contents: 'Περιεχόμενα',
  sections: [
    {
      id: 'controller',
      title: 'Υπεύθυνος επεξεργασίας',
      blocks: [
        'Το Mattheos Selections λειτουργεί από την Pasver AB, η οποία είναι υπεύθυνη επεξεργασίας για τα προσωπικά δεδομένα που περιγράφονται σε αυτή την πολιτική.',
        { lines: ['Pasver AB', 'Αρ. μητρώου 559053-2486', 'Ekfatsgatan 4', '117 57 Στοκχόλμη, Σουηδία'] },
        'Για οποιαδήποτε ερώτηση σχετικά με τα προσωπικά σας δεδομένα, στείλτε μας email στο info@mattheosselections.com.',
      ],
    },
    {
      id: 'data',
      title: 'Ποια δεδομένα συλλέγουμε και γιατί',
      blocks: [
        { heading: 'Όταν κάνετε μια παραγγελία' },
        'Συλλέγουμε το όνομά σας, τη διεύθυνση email, τον αριθμό τηλεφώνου, τη διεύθυνση αποστολής και χρέωσης και τα στοιχεία της παραγγελίας σας. Τα χρησιμοποιούμε για να παραδώσουμε την παραγγελία σας, να σας ενημερώνουμε για την παραγγελία και την αποστολή, να διαχειριζόμαστε επιστροφές και παράπονα και να τηρούμε τα λογιστικά αρχεία που απαιτεί ο νόμος. Νομική βάση: η εκτέλεση της σύμβασής μας μαζί σας και οι νομικές μας υποχρεώσεις σύμφωνα με τη σουηδική λογιστική νομοθεσία.',
        { heading: 'Όταν δημιουργείτε λογαριασμό' },
        'Αποθηκεύουμε το όνομά σας, τη διεύθυνση email σας και έναν κωδικό πρόσβασης (μόνο σε κρυπτογραφημένη μορφή, που δεν μπορούμε ποτέ να διαβάσουμε), ώστε να μπορείτε να συνδέεστε και να βλέπετε τις παραγγελίες σας. Νομική βάση: η εκτέλεση της σύμβασής μας μαζί σας.',
        { heading: 'Όταν ζητάτε ειδοποίηση' },
        'Αν μας ζητήσετε να σας στείλουμε email όταν ένα εξαντλημένο προϊόν είναι ξανά διαθέσιμο, αποθηκεύουμε τη διεύθυνση email σας και το προϊόν μέχρι να στείλουμε αυτό το email. Νομική βάση: η συγκατάθεσή σας, την οποία μπορείτε να ανακαλέσετε ανά πάσα στιγμή.',
        { heading: 'Όταν εγγράφεστε στο ενημερωτικό μας δελτίο' },
        'Αν εγγραφείτε στο ενημερωτικό μας δελτίο, χρησιμοποιούμε τη διεύθυνση email σας για να σας στέλνουμε νέα και προσφορές. Κάθε email περιέχει σύνδεσμο για διαγραφή. Νομική βάση: η συγκατάθεσή σας.',
        { heading: 'Όταν επικοινωνείτε μαζί μας' },
        'Αν μας στείλετε email ή χρησιμοποιήσετε τη φόρμα επικοινωνίας, χρησιμοποιούμε το όνομά σας, τη διεύθυνση email σας και το μήνυμά σας για να σας απαντήσουμε. Νομική βάση: το έννομο συμφέρον μας να απαντάμε στις ερωτήσεις σας.',
      ],
    },
    {
      id: 'payment',
      title: 'Πληρωμή',
      blocks: [
        'Οι πληρωμές διεκπεραιώνονται από την Kustom μέσω του Kustom Checkout. Τα στοιχεία της κάρτας ή του τραπεζικού σας λογαριασμού καταχωρούνται απευθείας στην Kustom και δεν φτάνουν ποτέ σε εμάς. Η Kustom επεξεργάζεται τα στοιχεία που χρειάζονται για την πληρωμή σύμφωνα με τη δική της πολιτική απορρήτου.',
      ],
    },
    {
      id: 'sharing',
      title: 'Με ποιους μοιραζόμαστε τα δεδομένα σας',
      blocks: [
        'Δεν πουλάμε ποτέ τα προσωπικά σας δεδομένα. Τα μοιραζόμαστε μόνο με εταιρείες που μας βοηθούν να λειτουργεί το κατάστημα και μόνο στον βαθμό που τα χρειάζονται:',
        {
          list: [
            'την Kustom, για την πληρωμή,',
            'τη μεταφορική εταιρεία που παραδίδει το δέμα σας (όνομα, διεύθυνση, τηλέφωνο και email για ενημερώσεις παράδοσης),',
            'τους παρόχους φιλοξενίας, βάσης δεδομένων και email, που αποθηκεύουν και επεξεργάζονται δεδομένα για λογαριασμό μας βάσει σύμβασης επεξεργασίας δεδομένων.',
          ],
        },
        'Ενδέχεται επίσης να κοινοποιήσουμε δεδομένα όταν το απαιτεί ο νόμος, για παράδειγμα στη σουηδική φορολογική αρχή.',
      ],
    },
    {
      id: 'transfers',
      title: 'Διαβιβάσεις εκτός ΕΕ',
      blocks: [
        'Ορισμένοι από τους παρόχους μας βρίσκονται εκτός ΕΕ/ΕΟΧ. Όταν προσωπικά δεδομένα διαβιβάζονται εκεί, φροντίζουμε να προστατεύονται από απόφαση επάρκειας της Ευρωπαϊκής Επιτροπής, όπως το Πλαίσιο Προστασίας Δεδομένων ΕΕ–ΗΠΑ, ή από τις τυποποιημένες συμβατικές ρήτρες της Επιτροπής.',
      ],
    },
    {
      id: 'retention',
      title: 'Πόσο καιρό διατηρούμε τα δεδομένα σας',
      blocks: [
        {
          list: [
            'Παραγγελίες και αποδείξεις: επτά χρόνια, όπως απαιτεί ο σουηδικός νόμος περί λογιστικής (bokföringslagen).',
            'Ο λογαριασμός σας: μέχρι να μας ζητήσετε να τον διαγράψουμε. Οι παραγγελίες σας διατηρούνται ωστόσο όσο απαιτεί ο νόμος.',
            'Αιτήματα ειδοποίησης διαθεσιμότητας: μέχρι να σας στείλουμε email ή μέχρι να μας ζητήσετε να τα διαγράψουμε.',
            'Ενημερωτικό δελτίο: μέχρι να διαγραφείτε.',
            'Email και μηνύματα: όσο χρειάζεται για να απαντήσουμε και να παρακολουθήσουμε το αίτημά σας.',
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies και τοπική αποθήκευση',
      blocks: [
        'Χρησιμοποιούμε μόνο ό,τι χρειάζεται ο ιστότοπος για να λειτουργεί. Δεν χρησιμοποιούμε cookies για στατιστικά ή διαφήμιση.',
        {
          list: [
            'ms_session — σας κρατά συνδεδεμένους (7 ημέρες ή 30 ημέρες αν επιλέξετε να παραμείνετε συνδεδεμένοι).',
            'NEXT_LOCALE — θυμάται τη γλώσσα που επιλέξατε (1 έτος).',
            'Το καλάθι και η λίστα αγαπημένων σας αποθηκεύονται στον τοπικό χώρο αποθήκευσης του προγράμματος περιήγησης, μόνο στη συσκευή σας.',
          ],
        },
        'Το Kustom Checkout ενδέχεται να ορίζει δικά του cookies που χρειάζονται για την ολοκλήρωση της πληρωμής.',
      ],
    },
    {
      id: 'rights',
      title: 'Τα δικαιώματά σας',
      blocks: [
        'Σύμφωνα με τον Γενικό Κανονισμό για την Προστασία Δεδομένων (GDPR) έχετε το δικαίωμα:',
        {
          list: [
            'να λάβετε αντίγραφο των προσωπικών δεδομένων που διατηρούμε για εσάς,',
            'να διορθωθούν ανακριβή δεδομένα,',
            'να διαγραφούν τα δεδομένα σας, εκτός αν πρέπει να τα διατηρήσουμε βάσει νόμου,',
            'να περιορίσετε ή να αντιταχθείτε στον τρόπο που τα χρησιμοποιούμε,',
            'να λάβετε τα δεδομένα σας σε μηχαναγνώσιμη μορφή (φορητότητα), και',
            'να ανακαλέσετε τη συγκατάθεσή σας ανά πάσα στιγμή, όπου η επεξεργασία βασίζεται σε συγκατάθεση.',
          ],
        },
        'Στείλτε μας email στο info@mattheosselections.com για να ασκήσετε οποιοδήποτε από αυτά τα δικαιώματα. Απαντάμε εντός ενός μήνα.',
        'Αν δεν είστε ικανοποιημένοι με τον τρόπο που χειριζόμαστε τα δεδομένα σας, μπορείτε να υποβάλετε καταγγελία στη σουηδική Αρχή Προστασίας Δεδομένων (Integritetsskyddsmyndigheten, IMY), imy.se.',
      ],
    },
    {
      id: 'changes',
      title: 'Αλλαγές σε αυτή την πολιτική',
      blocks: [
        'Ενδέχεται να ενημερώσουμε αυτή την πολιτική όταν αλλάζουν οι υπηρεσίες μας ή ο νόμος. Η πιο πρόσφατη έκδοση βρίσκεται πάντα σε αυτή τη σελίδα, μαζί με την ημερομηνία της τελευταίας ενημέρωσης.',
      ],
    },
  ],
};

const PRIVACY = { en, sv, el };

export const getPrivacyPolicy = (locale) => PRIVACY[locale] ?? PRIVACY.en;
