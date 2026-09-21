/**
 * Terms and conditions of sale, per language. English and Swedish started from the texts published on the
 * WordPress shop, corrected to state that prices include VAT (as they always have); Greek is translated
 * from the English. Kept out of the dictionaries so the text only loads on the terms page.
 *
 * Rendered by LegalDocument (src/components/legal), which describes the section and block format.
 */

const en = {
  eyebrow: 'Legal',
  title: 'Terms and Conditions of Sale',
  contents: 'Contents',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      blocks: [
        'Mattheos Selections is an online store offering high-quality honey, olive oil, and curated gift sets inspired by the flavors of Greece. We serve both private individuals and businesses within Sweden and internationally. Our mission is to bring the finest natural products to your doorstep with exceptional service and transparency.',
        'These Terms & Conditions govern your use of our website and the purchase of our products. By accessing the website or placing an order, you agree to be bound by these terms.',
        'We may update these Terms from time to time. Any changes take effect immediately once published on the website. It is your responsibility to check the Terms regularly. Continued use of the website constitutes acceptance of any updates.',
        'Mattheos Selections also reserves the right to:',
        {
          list: [
            'Modify, suspend, or terminate access to any part of the website;',
            'Update or change content, features, or policies without notice;',
            'Temporarily take the website offline for maintenance or updates.',
          ],
        },
      ],
    },
    {
      id: 'orders',
      title: 'Order Acceptance',
      blocks: [
        'All orders are subject to acceptance and product availability. We reserve the right to cancel or decline any order at our discretion.',
        'All prices on the website are in Swedish kronor (SEK) and include VAT. Nothing is added at checkout except shipping, where it applies; the VAT included in your order is shown at checkout.',
        'An order is considered accepted only after we issue an email confirming dispatch.',
      ],
    },
    {
      id: 'vat',
      title: 'VAT and Pricing',
      blocks: [
        'All prices include VAT at the rates below.',
        {
          list: [
            'VAT is 6% for all private and business customers within Sweden.',
            'VAT is 6% for private customers outside Sweden.',
            'VAT is 6% for business customers outside Sweden, provided a valid VAT number is submitted.',
          ],
        },
        { heading: 'VAT Number Verification' },
        'We manually verify VAT numbers after we receive the order.',
        'Note: If the provided VAT number is invalid and the customer does not respond with a valid one, we reserve the right to cancel the order.',
      ],
    },
    {
      id: 'shipping',
      title: 'Shipping',
      blocks: [
        {
          list: [
            'Within Sweden: 69 SEK flat rate. Free shipping on orders over 799 SEK.',
            'Outside Sweden: 25 EUR flat rate. Free shipping on orders over 179 EUR.',
          ],
        },
        'Shipping is available within Sweden and internationally. Delivery times and methods vary by location. All deliveries are securely packed.',
      ],
    },
    {
      id: 'payment',
      title: 'Payment',
      blocks: [
        'We accept secure online payments using trusted methods.',
        'For customers within Sweden, we offer flexible payment options via Klarna, including invoice and installment options, where available.',
        'All transactions must be authorized by your payment provider and Mattheos Selections reserves the right to cancel orders in case of fraud or unauthorized activity.',
      ],
    },
    {
      id: 'returns',
      title: 'Cancellations, Returns & Refunds',
      blocks: [
        { heading: 'Order Cancellation' },
        'You may cancel your order within 1 hour of placing it by contacting us directly. Orders that have already been processed or shipped cannot be canceled.',
        { heading: 'Returns & Refunds' },
        'You may return unopened and unused items within 14 days of delivery. To initiate a return, please contact us first for approval. Unauthorized returns will not be accepted.',
        {
          list: [
            'Items must be in original condition and packaging.',
            'Customers are responsible for return shipping costs.',
            'Refunds are issued to the original payment method once items are received and inspected.',
            'Shipping fees are non-refundable unless the return is due to our error.',
          ],
        },
      ],
    },
    {
      id: 'copyright',
      title: 'Copyright and Intellectual Property',
      blocks: [
        'All content on this website—including images, logos, product descriptions, and text—is the property of Mattheos Selections and protected under copyright and intellectual property laws. You may not copy, reproduce, or use any content without our prior written consent.',
      ],
    },
    {
      id: 'commercial-use',
      title: 'Commercial Use',
      blocks: [
        'Products purchased are intended for personal use or approved business gifting. Resale or commercial redistribution is not allowed without our explicit permission.',
      ],
    },
    {
      id: 'force-majeure',
      title: 'Force Majeure',
      blocks: [
        'We are not liable for delays or failures to perform due to events beyond our control, including natural disasters, transportation disruptions, or other unforeseeable circumstances.',
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy and Data Protection',
      blocks: [
        {
          text: 'We value your privacy and protect your personal data in accordance with GDPR and Swedish data protection laws. For full details, please read our Privacy Policy.',
          links: [{ label: 'Privacy Policy', path: '/privacy-policy' }],
        },
      ],
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      blocks: [
        'We strive to ensure the accuracy and safety of our services and products but shall not be liable for any indirect or consequential damages resulting from their use. Products are to be used as intended and in accordance with any provided instructions.',
      ],
    },
    {
      id: 'law',
      title: 'Governing Law',
      blocks: ['These Terms are governed by the laws of Sweden. Any disputes will be handled by the Swedish courts.'],
    },
    {
      id: 'complaints',
      title: 'Complaints and Customer Service',
      blocks: [
        'Mattheos Selections is committed to providing high-quality products and excellent customer service. If you have any complaints regarding your order, please contact us promptly at info@mattheosselections.com or by mail at:',
        { lines: ['Mattheos Selections', 'Ekfatsgatan 4', 'Stockholm 11757', 'Sweden'] },
        'For private consumers within Sweden and the European Union, we comply with all applicable consumer protection laws, including the Swedish Consumer Sales Act and the EU Consumer Rights Directive. This means you have the right to notify us of any issues with your purchase within the legally prescribed timeframes. We will acknowledge your complaint and respond within the time period required by law, aiming to resolve the issue efficiently and fairly.',
        'For business customers and customers outside the EU, complaint handling will be governed by the terms of the contract and relevant local laws.',
        'If you are not satisfied with our handling of your complaint, you may seek assistance from the relevant consumer protection authorities in your country.',
      ],
    },
  ],
};

const sv = {
  eyebrow: 'Juridiskt',
  title: 'Allmänna försäljningsvillkor',
  contents: 'Innehåll',
  sections: [
    {
      id: 'introduction',
      title: 'Inledning',
      blocks: [
        'Mattheos Selections är en webbutik som erbjuder högkvalitativ honung, olivolja och noga utvalda presentset inspirerade av grekiska smaker. Vi säljer till både privatpersoner och företag, i Sverige och internationellt. Vårt uppdrag är att leverera de finaste naturprodukterna till din dörr med exceptionell service och transparens.',
        'Dessa villkor reglerar din användning av vår webbplats och ditt köp av våra produkter. Genom att besöka webbplatsen eller göra en beställning samtycker du till att vara bunden av dessa villkor.',
        'Vi kan komma att uppdatera dessa villkor då och då. Alla ändringar träder i kraft omedelbart efter att de publicerats på webbplatsen. Det är ditt ansvar att regelbundet granska villkoren. Din fortsatta användning av webbplatsen innebär att du godkänner eventuella uppdateringar.',
        'Mattheos Selections förbehåller sig även rätten att:',
        {
          list: [
            'Ändra, begränsa eller avsluta åtkomsten till någon del av webbplatsen;',
            'Uppdatera eller ändra innehåll, funktioner eller policyer utan föregående meddelande;',
            'Tillfälligt stänga ner webbplatsen för underhåll eller uppdateringar.',
          ],
        },
      ],
    },
    {
      id: 'orders',
      title: 'Godkännande av beställningar',
      blocks: [
        'Alla beställningar förutsätter att vi godkänner dem och att produkterna finns i lager. Vi förbehåller oss rätten att annullera eller neka en beställning efter eget gottfinnande.',
        'Alla priser på webbplatsen anges i svenska kronor (SEK) inklusive moms. Inget läggs till i kassan utöver eventuell frakt; momsen som ingår i din beställning visas i kassan.',
        'En beställning anses godkänd först när vi har skickat ett e-postmeddelande som bekräftar att den har skickats.',
      ],
    },
    {
      id: 'vat',
      title: 'Moms och prissättning',
      blocks: [
        'Alla priser inkluderar moms enligt satserna nedan.',
        {
          list: [
            'Momsen är 6 % för alla privat- och företagskunder inom Sverige.',
            'Momsen är 6 % för privatkunder utanför Sverige.',
            'Momsen är 6 % för företagskunder utanför Sverige, förutsatt att ett giltigt momsregistreringsnummer anges.',
          ],
        },
        { heading: 'Verifiering av momsregistreringsnummer' },
        'Vi verifierar momsregistreringsnummer manuellt efter att vi mottagit beställningen.',
        'Observera: Om det angivna momsregistreringsnumret är ogiltigt och kunden inte svarar med ett giltigt nummer förbehåller vi oss rätten att annullera beställningen.',
      ],
    },
    {
      id: 'shipping',
      title: 'Frakt',
      blocks: [
        {
          list: [
            'Inom Sverige: fast pris 69 kr. Fri frakt vid köp över 799 kr.',
            'Utanför Sverige: fast pris 25 EUR. Fri frakt vid köp över 179 EUR.',
          ],
        },
        'Vi skickar inom Sverige och internationellt. Leveranstider och leveranssätt varierar beroende på destination. Alla försändelser packas säkert.',
      ],
    },
    {
      id: 'payment',
      title: 'Betalning',
      blocks: [
        'Vi tar emot säkra onlinebetalningar via pålitliga betalsätt.',
        'För kunder inom Sverige erbjuder vi flexibla betalningsalternativ via Klarna, inklusive faktura- och avbetalningsalternativ, där sådana finns tillgängliga.',
        'Alla transaktioner måste godkännas av din betalningsleverantör och Mattheos Selections förbehåller sig rätten att annullera beställningar vid bedrägeri eller obehörig aktivitet.',
      ],
    },
    {
      id: 'returns',
      title: 'Avbeställningar, returer och återbetalningar',
      blocks: [
        { heading: 'Avbeställning' },
        'Du kan avbeställa inom 1 timme efter att du har lagt din beställning genom att kontakta oss direkt. Beställningar som redan har behandlats eller skickats kan inte avbeställas.',
        { heading: 'Returer och återbetalningar' },
        'Du kan returnera oöppnade och oanvända varor inom 14 dagar efter leverans. Kontakta oss först för att få returen godkänd. Returer som inte har godkänts i förväg tas inte emot.',
        {
          list: [
            'Varorna måste vara i originalskick och i originalförpackning.',
            'Kunden står för kostnaden för returfrakten.',
            'Återbetalning sker till det ursprungliga betalsättet när vi har tagit emot och kontrollerat varorna.',
            'Fraktkostnaden återbetalas inte, såvida inte returen beror på ett fel från vår sida.',
          ],
        },
      ],
    },
    {
      id: 'copyright',
      title: 'Upphovsrätt och immateriella rättigheter',
      blocks: [
        'Allt innehåll på denna webbplats – inklusive bilder, logotyper, produktbeskrivningar och text – tillhör Mattheos Selections och är skyddat av upphovsrättslagen och annan immaterialrättslig lagstiftning. Du får inte kopiera, reproducera eller använda något innehåll utan vårt föregående skriftliga medgivande.',
      ],
    },
    {
      id: 'commercial-use',
      title: 'Kommersiell användning',
      blocks: [
        'Köpta produkter är avsedda för personligt bruk eller för godkända företagsgåvor. Återförsäljning eller kommersiell distribution är inte tillåten utan vårt uttryckliga tillstånd.',
      ],
    },
    {
      id: 'force-majeure',
      title: 'Force majeure',
      blocks: [
        'Vi ansvarar inte för förseningar eller för att vi inte kan fullgöra våra åtaganden på grund av händelser utanför vår kontroll, inklusive naturkatastrofer, transportstörningar eller andra oförutsedda omständigheter.',
      ],
    },
    {
      id: 'privacy',
      title: 'Integritet och dataskydd',
      blocks: [
        {
          text: 'Vi värdesätter din integritet och skyddar dina personuppgifter i enlighet med GDPR och svensk dataskyddslagstiftning. Läs vår integritetspolicy för fullständig information.',
          links: [{ label: 'integritetspolicy', path: '/privacy-policy' }],
        },
      ],
    },
    {
      id: 'liability',
      title: 'Ansvarsbegränsning',
      blocks: [
        'Vi strävar efter att våra tjänster och produkter ska vara korrekta och säkra, men ansvarar inte för indirekta skador eller följdskador som uppstår vid användningen av dem. Produkterna ska användas på avsett sätt och enligt eventuella medföljande anvisningar.',
      ],
    },
    {
      id: 'law',
      title: 'Tillämplig lag',
      blocks: ['Dessa villkor regleras av svensk lag. Eventuella tvister avgörs av svensk domstol.'],
    },
    {
      id: 'complaints',
      title: 'Klagomål och kundtjänst',
      blocks: [
        'Mattheos Selections strävar efter att tillhandahålla högkvalitativa produkter och utmärkt kundservice. Om du har klagomål på din beställning ber vi dig kontakta oss snarast på info@mattheosselections.com eller per post till:',
        { lines: ['Mattheos Selections', 'Ekfatsgatan 4', '117 57 Stockholm', 'Sverige'] },
        'För privatkunder inom Sverige och Europeiska unionen följer vi alla tillämpliga konsumentskyddslagar, inklusive konsumentköplagen och EU:s konsumenträttsdirektiv. Det innebär att du har rätt att meddela oss om eventuella problem med ditt köp inom de lagstadgade tidsramarna. Vi bekräftar att vi har tagit emot ditt klagomål och svarar inom den tid som lagen kräver, i syfte att lösa problemet effektivt och rättvist.',
        'För företagskunder och kunder utanför EU regleras klagomålshanteringen av avtalsvillkoren och relevanta lokala lagar.',
        'Om du inte är nöjd med vår hantering av ditt klagomål kan du vända dig till behöriga konsumentmyndigheter i ditt land.',
      ],
    },
  ],
};

const el = {
  eyebrow: 'Νομικά',
  title: 'Όροι και προϋποθέσεις πώλησης',
  contents: 'Περιεχόμενα',
  sections: [
    {
      id: 'introduction',
      title: 'Εισαγωγή',
      blocks: [
        'Η Mattheos Selections είναι ένα ηλεκτρονικό κατάστημα που προσφέρει μέλι υψηλής ποιότητας, ελαιόλαδο και επιμελημένα σετ δώρου εμπνευσμένα από τις γεύσεις της Ελλάδας. Εξυπηρετούμε τόσο ιδιώτες όσο και επιχειρήσεις στη Σουηδία και διεθνώς. Αποστολή μας είναι να φέρνουμε τα καλύτερα φυσικά προϊόντα στην πόρτα σας, με εξαιρετική εξυπηρέτηση και διαφάνεια.',
        'Οι παρόντες Όροι & Προϋποθέσεις διέπουν τη χρήση του ιστότοπού μας και την αγορά των προϊόντων μας. Με την επίσκεψη στον ιστότοπο ή την υποβολή παραγγελίας, αποδέχεστε ότι δεσμεύεστε από τους παρόντες όρους.',
        'Ενδέχεται να ενημερώνουμε τους Όρους κατά καιρούς. Οι αλλαγές ισχύουν αμέσως μόλις δημοσιευτούν στον ιστότοπο. Είναι δική σας ευθύνη να ελέγχετε τακτικά τους Όρους. Η συνεχιζόμενη χρήση του ιστότοπου συνιστά αποδοχή τυχόν ενημερώσεων.',
        'Η Mattheos Selections διατηρεί επίσης το δικαίωμα να:',
        {
          list: [
            'Τροποποιεί, αναστέλλει ή διακόπτει την πρόσβαση σε οποιοδήποτε μέρος του ιστότοπου·',
            'Ενημερώνει ή αλλάζει περιεχόμενο, λειτουργίες ή πολιτικές χωρίς προειδοποίηση·',
            'Θέτει προσωρινά τον ιστότοπο εκτός λειτουργίας για συντήρηση ή ενημερώσεις.',
          ],
        },
      ],
    },
    {
      id: 'orders',
      title: 'Αποδοχή παραγγελιών',
      blocks: [
        'Όλες οι παραγγελίες υπόκεινται σε αποδοχή και στη διαθεσιμότητα των προϊόντων. Διατηρούμε το δικαίωμα να ακυρώσουμε ή να απορρίψουμε οποιαδήποτε παραγγελία κατά την κρίση μας.',
        'Όλες οι τιμές στον ιστότοπο αναγράφονται σε σουηδικές κορόνες (SEK) και περιλαμβάνουν ΦΠΑ. Στο ταμείο δεν προστίθεται τίποτα πέρα από τα τυχόν μεταφορικά· ο ΦΠΑ που περιλαμβάνεται στην παραγγελία σας εμφανίζεται στο ταμείο.',
        'Μια παραγγελία θεωρείται αποδεκτή μόνο αφού σας στείλουμε email που επιβεβαιώνει την αποστολή της.',
      ],
    },
    {
      id: 'vat',
      title: 'ΦΠΑ και τιμολόγηση',
      blocks: [
        'Όλες οι τιμές περιλαμβάνουν ΦΠΑ με τους παρακάτω συντελεστές.',
        {
          list: [
            'Ο ΦΠΑ είναι 6% για όλους τους ιδιώτες και τις επιχειρήσεις εντός Σουηδίας.',
            'Ο ΦΠΑ είναι 6% για ιδιώτες εκτός Σουηδίας.',
            'Ο ΦΠΑ είναι 6% για επιχειρήσεις εκτός Σουηδίας, εφόσον δηλωθεί έγκυρος αριθμός ΦΠΑ.',
          ],
        },
        { heading: 'Επαλήθευση αριθμού ΦΠΑ' },
        'Επαληθεύουμε χειροκίνητα τους αριθμούς ΦΠΑ αφού λάβουμε την παραγγελία.',
        'Σημείωση: Αν ο δηλωμένος αριθμός ΦΠΑ δεν είναι έγκυρος και ο πελάτης δεν απαντήσει με έγκυρο αριθμό, διατηρούμε το δικαίωμα να ακυρώσουμε την παραγγελία.',
      ],
    },
    {
      id: 'shipping',
      title: 'Αποστολή',
      blocks: [
        {
          list: [
            'Εντός Σουηδίας: σταθερή χρέωση 69 SEK. Δωρεάν αποστολή για παραγγελίες άνω των 799 SEK.',
            'Εκτός Σουηδίας: σταθερή χρέωση 25 EUR. Δωρεάν αποστολή για παραγγελίες άνω των 179 EUR.',
          ],
        },
        'Η αποστολή είναι διαθέσιμη εντός Σουηδίας και διεθνώς. Οι χρόνοι και οι τρόποι παράδοσης διαφέρουν ανάλογα με την τοποθεσία. Όλες οι αποστολές συσκευάζονται με ασφάλεια.',
      ],
    },
    {
      id: 'payment',
      title: 'Πληρωμή',
      blocks: [
        'Δεχόμαστε ασφαλείς ηλεκτρονικές πληρωμές με αξιόπιστους τρόπους.',
        'Για πελάτες εντός Σουηδίας προσφέρουμε ευέλικτους τρόπους πληρωμής μέσω Klarna, όπως πληρωμή με τιμολόγιο ή σε δόσεις, όπου είναι διαθέσιμοι.',
        'Όλες οι συναλλαγές πρέπει να εγκρίνονται από τον πάροχο πληρωμών σας και η Mattheos Selections διατηρεί το δικαίωμα να ακυρώνει παραγγελίες σε περίπτωση απάτης ή μη εξουσιοδοτημένης δραστηριότητας.',
      ],
    },
    {
      id: 'returns',
      title: 'Ακυρώσεις, επιστροφές προϊόντων & χρημάτων',
      blocks: [
        { heading: 'Ακύρωση παραγγελίας' },
        'Μπορείτε να ακυρώσετε την παραγγελία σας εντός 1 ώρας από την υποβολή της, επικοινωνώντας απευθείας μαζί μας. Παραγγελίες που έχουν ήδη διεκπεραιωθεί ή αποσταλεί δεν μπορούν να ακυρωθούν.',
        { heading: 'Επιστροφές προϊόντων & χρημάτων' },
        'Μπορείτε να επιστρέψετε σφραγισμένα και αχρησιμοποίητα προϊόντα εντός 14 ημερών από την παράδοση. Για να ξεκινήσετε μια επιστροφή, επικοινωνήστε πρώτα μαζί μας για έγκριση. Μη εγκεκριμένες επιστροφές δεν γίνονται δεκτές.',
        {
          list: [
            'Τα προϊόντα πρέπει να είναι στην αρχική τους κατάσταση και συσκευασία.',
            'Τα έξοδα αποστολής της επιστροφής βαρύνουν τον πελάτη.',
            'Τα χρήματα επιστρέφονται στον αρχικό τρόπο πληρωμής μόλις παραληφθούν και ελεγχθούν τα προϊόντα.',
            'Τα έξοδα αποστολής δεν επιστρέφονται, εκτός αν η επιστροφή οφείλεται σε δικό μας λάθος.',
          ],
        },
      ],
    },
    {
      id: 'copyright',
      title: 'Πνευματικά δικαιώματα και πνευματική ιδιοκτησία',
      blocks: [
        'Όλο το περιεχόμενο αυτού του ιστότοπου —συμπεριλαμβανομένων εικόνων, λογοτύπων, περιγραφών προϊόντων και κειμένων— ανήκει στη Mattheos Selections και προστατεύεται από τη νομοθεσία περί πνευματικών δικαιωμάτων και πνευματικής ιδιοκτησίας. Δεν επιτρέπεται η αντιγραφή, αναπαραγωγή ή χρήση οποιουδήποτε περιεχομένου χωρίς την προηγούμενη γραπτή μας συγκατάθεση.',
      ],
    },
    {
      id: 'commercial-use',
      title: 'Εμπορική χρήση',
      blocks: [
        'Τα προϊόντα που αγοράζονται προορίζονται για προσωπική χρήση ή για εγκεκριμένα εταιρικά δώρα. Η μεταπώληση ή η εμπορική διανομή δεν επιτρέπεται χωρίς τη ρητή άδειά μας.',
      ],
    },
    {
      id: 'force-majeure',
      title: 'Ανωτέρα βία',
      blocks: [
        'Δεν ευθυνόμαστε για καθυστερήσεις ή αδυναμία εκτέλεσης λόγω γεγονότων εκτός του ελέγχου μας, όπως φυσικές καταστροφές, διαταραχές στις μεταφορές ή άλλες απρόβλεπτες περιστάσεις.',
      ],
    },
    {
      id: 'privacy',
      title: 'Ιδιωτικότητα και προστασία δεδομένων',
      blocks: [
        {
          text: 'Σεβόμαστε την ιδιωτικότητά σας και προστατεύουμε τα προσωπικά σας δεδομένα σύμφωνα με τον GDPR και τη σουηδική νομοθεσία για την προστασία δεδομένων. Για πλήρεις πληροφορίες, διαβάστε την Πολιτική Απορρήτου μας.',
          links: [{ label: 'Πολιτική Απορρήτου', path: '/privacy-policy' }],
        },
      ],
    },
    {
      id: 'liability',
      title: 'Περιορισμός ευθύνης',
      blocks: [
        'Καταβάλλουμε κάθε προσπάθεια να διασφαλίσουμε την ακρίβεια και την ασφάλεια των υπηρεσιών και των προϊόντων μας, αλλά δεν ευθυνόμαστε για τυχόν έμμεσες ή αποθετικές ζημίες που προκύπτουν από τη χρήση τους. Τα προϊόντα πρέπει να χρησιμοποιούνται όπως προβλέπεται και σύμφωνα με τις οδηγίες που παρέχονται.',
      ],
    },
    {
      id: 'law',
      title: 'Εφαρμοστέο δίκαιο',
      blocks: ['Οι παρόντες Όροι διέπονται από το σουηδικό δίκαιο. Τυχόν διαφορές εκδικάζονται από τα σουηδικά δικαστήρια.'],
    },
    {
      id: 'complaints',
      title: 'Παράπονα και εξυπηρέτηση πελατών',
      blocks: [
        'Η Mattheos Selections δεσμεύεται να προσφέρει προϊόντα υψηλής ποιότητας και άριστη εξυπηρέτηση. Αν έχετε κάποιο παράπονο σχετικά με την παραγγελία σας, επικοινωνήστε μαζί μας άμεσα στο info@mattheosselections.com ή ταχυδρομικά στη διεύθυνση:',
        { lines: ['Mattheos Selections', 'Ekfatsgatan 4', '117 57 Stockholm', 'Σουηδία'] },
        'Για ιδιώτες καταναλωτές εντός Σουηδίας και Ευρωπαϊκής Ένωσης, συμμορφωνόμαστε με όλους τους ισχύοντες νόμους προστασίας των καταναλωτών, συμπεριλαμβανομένου του σουηδικού νόμου για τις καταναλωτικές πωλήσεις (Konsumentköplagen) και της Οδηγίας της ΕΕ για τα δικαιώματα των καταναλωτών. Αυτό σημαίνει ότι έχετε δικαίωμα να μας ενημερώσετε για τυχόν προβλήματα με την αγορά σας εντός των νόμιμων προθεσμιών. Θα επιβεβαιώσουμε τη λήψη του παραπόνου σας και θα απαντήσουμε εντός της προθεσμίας που ορίζει ο νόμος, με στόχο να επιλύσουμε το ζήτημα αποτελεσματικά και δίκαια.',
        'Για επιχειρήσεις και πελάτες εκτός ΕΕ, ο χειρισμός των παραπόνων διέπεται από τους όρους της σύμβασης και την εκάστοτε τοπική νομοθεσία.',
        'Αν δεν είστε ικανοποιημένοι με τον χειρισμό του παραπόνου σας, μπορείτε να απευθυνθείτε στις αρμόδιες αρχές προστασίας καταναλωτών της χώρας σας.',
      ],
    },
  ],
};

const TERMS = { en, sv, el };

export const getTerms = (locale) => TERMS[locale] ?? TERMS.en;
