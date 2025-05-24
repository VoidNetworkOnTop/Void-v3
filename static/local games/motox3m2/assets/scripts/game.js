/* This file, related code, assets, styling and indicia are Copyright (c) Friv.com - Unauthorised reproduction is prohibited. All rights reserved. */

var ver = "v X.XX";
var debug = false;
//alert(ver);

if (debug) {
    debugText.style.display = "block";
    setInterval(function () {
        debugText.innerHTML = "Debugging Info - Tap to remove. Build: " + ver + "<br>innerHeight:" + innerHeight + "  screen.height:" + screen.height + "  Ratio:" + (innerHeight / screen.height);
    }, 1000);

    debugText.addEventListener("click", function () {
        debugText.style.display = "none";
    });
}

var lang = navigator.language.toLowerCase();

var british = false;
if (lang == "en-gb") {
    british = true;
}



if (debug) {

    //ar-lemonada
    //az-verdana
    //bg-verdana
    //el-verdana
    //fa-lemonada
    //he-heebo
    //hi-seems-ok-with-default
    //hy-seems-ok-with-default
    //ja-improve
    //ka-improve
    //ko-sans-serif
    //mk-verdana
    //ru-verdana
    //sr-verdana
    //th-seems-ok-with-default
    //uk-verdana
    //ur-lemonada
    //vi-verdana
    //zh-seems-ok-with-default
    
     ["ar", "az", "bg", "bs", "ca", "cs", "da", "de", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu", "hy", "id", "it", "ja", "ka", "ko", "lt", "lv", "mk", "ms", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sq", "sr", "sv", "tl", "th", "tr", "uk", "ur", "uz", "vi", "zh"];

    lang = "zh"; //spoof lang
}

var shortLang = lang.slice(0, 2);

const d = new Date();
let day = d.getDate();

//COOKIES
/////////

var pageViews = -1;
var gamePlays = -1;
var dressupCounter = -1;

//pageview
var n = localStorage.getItem('visitsCounter');
if (n === null) {
    n = 0;
}
pageViews = n;
console.log("cookie pageviews: " + pageViews);

//gameplays
var x = localStorage.getItem('gamePlays');
if (x === null) {
    x = 0;
}

gamePlays = x;

function gamePlaysIncrement() {
    gamePlays++;
    localStorage.setItem("gamePlays", gamePlays);
    console.log("cookie gameplays increment");
}

console.log("cookie gameplays: " + gamePlays);

const gamePlaysIncrementTimeout = setTimeout(gamePlaysIncrement, 100000);

///LOCALISED FONTS
//////////////////

// First, make sure the DOM is fully loaded before trying to access the element
document.addEventListener('DOMContentLoaded', function () {

    //const infoBoxDesc = document.getElementById('infoBoxDesc');

    if (infoBoxDesc) {
        switch (shortLang) {
            case "ar":
            case "fa":
            case "ur":
                infoBoxDesc.style.fontFamily = "lemonada, sans-serif";
                infoBoxDesc.style.lineHeight = "3.5vmax"; //tested for font-size of 2.5vmax
                break;
            case "az":
            case "bg":
            case "el":
            case "mk":
            case "ru":
            case "sr":
            case "uk":
            case "vi":
                infoBoxDesc.style.fontFamily = "verdana, sans-serif";
                break;
            case "he":
                infoBoxDesc.style.fontFamily = "heebo, ssans-serif";
                infoBoxDesc.style.lineHeight = "3vmax";
                break;
                case "ja":
                infoBoxDesc.style.fontFamily = "notoSansJA, sans-serif";
                break;
                case "ka":
                infoBoxDesc.style.fontFamily = "notoSansKA, sans-serif";
                break;
                case "ko":
                //infoBoxDesc.style.fontFamily = "notoSansKO, sans-serif";
                infoBoxDesc.style.fontFamily = "sans-serif"; //hard to justify 10MB for custom KO font
                break;
                //use verdana just to be sure of how browser may 'auto choose' on font... 
            case "hi":
            case "hy":
            case "co":
            case "th":
            case "zh":
                infoBoxDesc.style.fontFamily = "verdana";
            default:
                //infoBoxDesc.style.fontFamily = "verdana";
        }
    }

    console.log("AAA doing font swap");

});

///LOCALISED LANGUAGE
/////////////////////

const localizedText = {
    en: {
        thankyou: "Thank you!",
        oldGame: "This is a treasured old game we're making available to keep memories alive. There are no ads. Enjoy!",
        helpWithTranslation: "We have been trying to write a unique little intro for every single game on Friv. Please read the description above. Do you think it's good or not? Please help us by voting!",
        //Do you speak XXX? The game description above was automatically translated from English. Does it seem good to you? Please help us by voting!
        waitLoading: "Please <span class=lightYellow>WAIT</span> for this game to load ...it’s well worth it!",
        surveySound: "Please help! How would you rate the sound in this game? For example, if there is music, do you like it?",
        touchDesktopWarning: "Notice: This game is designed to work on computers with a keyboard and mouse. It looks like you're using a mobile device. Tap <span class=orange>here</span> to play another great game on this site.",
    },

    ar: {
        thankyou: "شكراً لك!",
        oldGame: "هذه لعبة قديمة ثمينة نوفرها للحفاظ على الذكريات حية. لا توجد إعلانات. استمتع!",
        helpWithTranslation: "هل تتحدث العربية؟ تم ترجمة وصف اللعبة أعلاه تلقائيًا من الإنجليزية. هل يبدو جيدًا لك؟ يرجى مساعدتنا بالتصويت!",
        waitLoading: "الرجاء <span class=lightYellow>الانتظار</span> حتى يتم تحميل هذه اللعبة ... إنها تستحق ذلك!",
        surveySound: "الرجاء المساعدة! كيف تقيم الصوت في هذه اللعبة؟ على سبيل المثال، إذا كانت هناك موسيقى، هل تعجبك؟",
        touchDesktopWarning: "ملاحظة: هذه اللعبة مصممة للعمل على أجهزة الكمبيوتر المزودة بلوحة مفاتيح وماوس. يبدو أنك تستخدم جهازًا محمولًا. انقر <span class=orange>هنا</span> لتشغيل لعبة رائعة أخرى على هذا الموقع.",
    },
    az: {
        thankyou: "Çox sağ olun!",
        oldGame: "Bu, xatirələri yaşatmaq üçün təqdim etdiyimiz dəyərli köhnə bir oyundur. Reklam yoxdur. Zövq alın!",
        helpWithTranslation: "Siz Azərbaycan dilində danışırsınız? Yuxarıdakı oyun təsviri avtomatik olaraq ingilis dilindən tərcümə olunub. Sizə yaxşı görünür? Zəhmət olmasa səs verərək bizə kömək edin!",
        waitLoading: "Zəhmət olmasa bu oyunun yüklənməsini <span class=lightYellow>GÖZLƏYİN</span> ... buna dəyər!",
        surveySound: "Zəhmət olmasa kömək edin! Bu oyundakı səsi necə qiymətləndirərdiniz? Məsələn, musiqi varsa, xoşunuza gəlirmi?",
        touchDesktopWarning: "Diqqət: Bu oyun klaviatura və siçan ilə işləyən kompüterlər üçün nəzərdə tutulmuşdur. Görünür ki, siz mobil cihaz istifadə edirsiniz. Bu saytda başqa əla bir oyun oynamaq üçün <span class=orange>buraya</span> toxunun.",
    },
    bg: {
        thankyou: "Благодаря!",
        oldGame: "Това е ценна стара игра, която предоставяме, за да запазим спомените живи. Няма реклами. Насладете се!",
        helpWithTranslation: "Говорите ли български? Описанието на играта по-горе беше автоматично преведено от английски. Изглежда ли ви добре? Моля, помогнете ни, като гласувате!",
        waitLoading: "Моля, <span class=lightYellow>ИЗЧАКАЙТЕ</span> тази игра да зареди ... заслужава си!",
        surveySound: "Моля, помогнете! Как бихте оценили звука в тази игра? Например, ако има музика, харесва ли ви?",
        touchDesktopWarning: "Забележка: Тази игра е проектирана да работи на компютри с клавиатура и мишка. Изглежда, че използвате мобилно устройство. Натиснете <span class=orange>тук</span>, за да играете друга страхотна игра на този сайт.",
    },
    bs: {
        thankyou: "Hvala!",
        oldGame: "Ovo je dragocjena stara igra koju stavljamo na raspolaganje kako bismo sačuvali uspomene. Nema reklama. Uživajte!",
        helpWithTranslation: "Govorite li bosanski? Gornji opis igre automatski je preveden s engleskog. Čini li vam se dobrim? Molimo vas da nam pomognete glasanjem!",
        waitLoading: "Molimo <span class=lightYellow>SAČEKAJTE</span> da se ova igra učita ... itekako se isplati!",
        surveySound: "Molimo vas pomozite! Kako biste ocijenili zvuk u ovoj igri? Na primjer, ako ima muzike, sviđa li vam se?",
        touchDesktopWarning: "Obavijest: Ova igra je dizajnirana za rad na računarima s tastaturom i mišem. Izgleda da koristite mobilni uređaj. Dodirnite <span class=orange>ovdje</span> da biste zaigrali još jednu sjajnu igru na ovoj stranici.",
    },
    ca: {
        thankyou: "Gràcies!",
        oldGame: "Aquest és un joc antic preuat que posem a la vostra disposició per mantenir vius els records. No hi ha anuncis. Gaudeix-ne!",
        helpWithTranslation: "Parles català? La descripció del joc anterior s'ha traduït automàticament de l'anglès. Et sembla bé? Ajuda'ns votant!",
        waitLoading: "Si us plau, <span class=lightYellow>ESPERA</span> que es carregui aquest joc... val molt la pena!",
        surveySound: "Si us plau, ajuda! Com valoraries el so d'aquest joc? Per exemple, si hi ha música, t'agrada?",
        touchDesktopWarning: "Avís: Aquest joc està dissenyat per funcionar en ordinadors amb teclat i ratolí. Sembla que estàs utilitzant un dispositiu mòbil. Toca <span class=orange>aquí</span> per jugar a un altre joc fantàstic en aquest lloc.",
    },
    cs: {
        thankyou: "Děkuji!",
        oldGame: "Toto je vzácná stará hra, kterou zpřístupňujeme, abychom uchovali vzpomínky. Nejsou zde žádné reklamy. Užijte si ji!",
        helpWithTranslation: "Mluvíte česky? Popis hry výše byl automaticky přeložen z angličtiny. Zdá se vám dobrý? Prosím, pomozte nám hlasováním!",
        waitLoading: "Prosím, <span class=lightYellow>ČEKEJTE</span>, než se tato hra načte ... stojí za to!",
        surveySound: "Prosím, pomozte! Jak byste ohodnotili zvuk v této hře? Například, pokud je tam hudba, líbí se vám?",
        touchDesktopWarning: "Upozornění: Tato hra je navržena pro práci na počítačích s klávesnicí a myší. Vypadá to, že používáte mobilní zařízení. Klepněte <span class=orange>zde</span> a zahrajte si další skvělou hru na této stránce.",
    },
    da: {
        thankyou: "Tak skal du have!",
        oldGame: "Dette er et kært gammelt spil, som vi gør tilgængeligt for at holde minderne i live. Der er ingen reklamer. God fornøjelse!",
        helpWithTranslation: "Taler du dansk? Spilbeskrivelsen ovenfor er automatisk oversat fra engelsk. Synes du, den ser god ud? Hjælp os ved at stemme!",
        waitLoading: "Vent <span class=lightYellow>VENLIGST</span> på at dette spil indlæses ... det er det hele værd!",
        surveySound: "Hjælp os! Hvordan vil du vurdere lyden i dette spil? For eksempel, hvis der er musik, kan du så lide den?",
        touchDesktopWarning: "Bemærk: Dette spil er designet til at fungere på computere med tastatur og mus. Det ser ud til, at du bruger en mobilenhed. Tryk <span class=orange>her</span> for at spille et andet fantastisk spil på dette websted.",
    },
    de: {
        thankyou: "Vielen Dank!",
        oldGame: "Dies ist ein geschätztes altes Spiel, das wir zur Verfügung stellen, um Erinnerungen lebendig zu halten. Es gibt keine Werbung. Viel Spaß!",
        helpWithTranslation: "Sprichst du Deutsch? Die obige Spielbeschreibung wurde automatisch aus dem Englischen übersetzt. Sieht sie gut für dich aus? Bitte hilf uns, indem du abstimmst!",
        waitLoading: "Bitte <span class=lightYellow>WARTE</span>, bis dieses Spiel geladen ist ... es ist es wert!",
        surveySound: "Bitte hilf! Wie würdest du den Sound in diesem Spiel bewerten? Zum Beispiel, wenn es Musik gibt, gefällt sie dir?",
        touchDesktopWarning: "Hinweis: Dieses Spiel ist für die Verwendung auf Computern mit Tastatur und Maus konzipiert. Es sieht so aus, als ob du ein Mobilgerät verwendest. Tippe <span class=orange>hier</span>, um ein anderes tolles Spiel auf dieser Seite zu spielen.",
    },
    el: {
        thankyou: "Ευχαριστώ!",
        oldGame: "Αυτό είναι ένα αγαπημένο παλιό παιχνίδι που διαθέτουμε για να κρατήσουμε τις αναμνήσεις ζωντανές. Δεν υπάρχουν διαφημίσεις. Απολαύστε το!",
        helpWithTranslation: "Μιλάτε Ελληνικά; Η παραπάνω περιγραφή του παιχνιδιού μεταφράστηκε αυτόματα από τα Αγγλικά. Σας φαίνεται καλή; Παρακαλούμε βοηθήστε μας ψηφίζοντας!",
        waitLoading: "Παρακαλώ <span class=lightYellow>ΠΕΡΙΜΕΝΕΤΕ</span> να φορτώσει αυτό το παιχνίδι ... αξίζει τον κόπο!",
        surveySound: "Παρακαλώ βοηθήστε! Πώς θα βαθμολογούσατε τον ήχο σε αυτό το παιχνίδι; Για παράδειγμα, αν υπάρχει μουσική, σας αρέσει;",
        touchDesktopWarning: "Σημείωση: Αυτό το παιχνίδι έχει σχεδιαστεί για να λειτουργεί σε υπολογιστές με πληκτρολόγιο και ποντίκι. Φαίνεται ότι χρησιμοποιείτε μια κινητή συσκευή. Πατήστε <span class=orange>εδώ</span> για να παίξετε ένα άλλο υπέροχο παιχνίδι σε αυτόν τον ιστότοπο.",
    },
    es: {
        thankyou: "¡Gracias!",
        oldGame: "Este es un viejo juego preciado que ponemos a disposición para mantener vivos los recuerdos. No hay anuncios. ¡Disfruta!",
        helpWithTranslation: "¿Hablas español? La descripción del juego de arriba se tradujo automáticamente del inglés. ¿Te parece bien? ¡Ayúdanos votando!",
        waitLoading: "Por favor, <span class=lightYellow>ESPERA</span> a que se cargue este juego... ¡vale la pena!",
        surveySound: "¡Por favor, ayuda! ¿Cómo calificarías el sonido de este juego? Por ejemplo, si hay música, ¿te gusta?",
        touchDesktopWarning: "Aviso: Este juego está diseñado para funcionar en computadoras con teclado y ratón. Parece que estás usando un dispositivo móvil. Toca <span class=orange>aquí</span> para jugar a otro gran juego en este sitio.",
    },
    et: {
        thankyou: "Aitäh!",
        oldGame: "See on väärtuslik vana mäng, mille teeme kättesaadavaks mälestuste elus hoidmiseks. Reklaame pole. Naudi!",
        helpWithTranslation: "Kas sa räägid eesti keelt? Ülaltoodud mängu kirjeldus tõlgiti automaatselt inglise keelest. Kas see tundub sulle hea? Palun aita meid hääletades!",
        waitLoading: "Palun <span class=lightYellow>OOTA</span> selle mängu laadimist ... see on seda väärt!",
        surveySound: "Palun aita! Kuidas sa hindaksid selle mängu heli? Näiteks, kui seal on muusika, kas see sulle meeldib?",
        touchDesktopWarning: "Märkus: See mäng on mõeldud töötamiseks klaviatuuri ja hiirega arvutites. Tundub, et sa kasutad mobiilseadet. Puuduta <span class=orange>siin</span>, et mängida sellel saidil teist suurepärast mängu.",
    },
    fa: {
        thankyou: "متشکرم!",
        oldGame: "این یک بازی قدیمی و ارزشمند است که برای زنده نگه داشتن خاطرات در دسترس قرار داده‌ایم. هیچ تبلیغی وجود ندارد. لذت ببرید!",
        helpWithTranslation: "آیا شما فارسی صحبت می‌کنید؟ توضیحات بازی در بالا به طور خودکار از انگلیسی ترجمه شده است. آیا به نظر شما خوب می‌رسد؟ لطفاً با رای دادن به ما کمک کنید!",
        waitLoading: "لطفاً <span class=lightYellow>صبر کنید</span> تا این بازی بارگیری شود ... ارزشش را دارد!",
        surveySound: "لطفاً کمک کنید! صداگذاری این بازی را چگونه ارزیابی می‌کنید؟ به عنوان مثال، اگر موسیقی وجود دارد، آیا آن را دوست دارید؟",
        touchDesktopWarning: "توجه: این بازی برای کار بر روی رایانه‌های دارای صفحه‌کلید و ماوس طراحی شده است. به نظر می‌رسد که شما از یک دستگاه تلفن همراه استفاده می‌کنید. برای انجام یک بازی عالی دیگر در این سایت، <span class=orange>اینجا</span> ضربه بزنید.",
    },
    fi: {
        thankyou: "Kiitos!",
        oldGame: "Tämä on arvostettu vanha peli, jonka tarjoamme muistojen elävänä pitämiseksi. Siinä ei ole mainoksia. Nauti!",
        helpWithTranslation: "Puhutko suomea? Yllä oleva pelin kuvaus on käännetty automaattisesti englannista. Vaikuttaako se hyvältä? Auta meitä äänestämällä!",
        waitLoading: "Ole hyvä ja <span class=lightYellow>ODOTA</span> tämän pelin latautumista... se on sen arvoista!",
        surveySound: "Ole hyvä ja auta! Miten arvioisit tämän pelin ääntä? Esimerkiksi, jos siinä on musiikkia, pidätkö siitä?",
        touchDesktopWarning: "Huomaa: Tämä peli on suunniteltu toimimaan tietokoneilla, joissa on näppäimistö ja hiiri. Vaikuttaa siltä, että käytät mobiililaitetta. Napauta <span class=orange>tästä</span> pelataksesi toista mahtavaa peliä tällä sivustolla.",
    },
    fr: {
        thankyou: "Merci !",
        oldGame: "Ceci est un vieux jeu précieux que nous mettons à disposition pour garder les souvenirs vivants. Il n'y a pas de publicités. Profitez-en !",
        helpWithTranslation: "Parlez-vous français ? La description du jeu ci-dessus a été traduite automatiquement de l'anglais. Vous semble-t-elle correcte ? Aidez-nous en votant !",
        waitLoading: "Veuillez <span class=lightYellow>ATTENDRE</span> le chargement de ce jeu... ça en vaut la peine !",
        surveySound: "Aidez-nous s'il vous plaît ! Comment évalueriez-vous le son de ce jeu ? Par exemple, s'il y a de la musique, l'aimez-vous ?",
        touchDesktopWarning: "Remarque : Ce jeu est conçu pour fonctionner sur des ordinateurs avec un clavier et une souris. Il semble que vous utilisiez un appareil mobile. Appuyez <span class=orange>ici</span> pour jouer à un autre excellent jeu sur ce site.",
    },
    he: {
        thankyou: "!תודה",
        oldGame: "זהו משחק ישן ומוערך שאנו מציעים כדי לשמור על הזיכרונות בחיים. אין פרסומות. תהנו!",
        helpWithTranslation: "האם אתה דובר עברית? תיאור המשחק למעלה תורגם אוטומטית מאנגלית. האם זה נראה לך טוב? אנא עזור לנו על ידי הצבעה!",
        waitLoading: "אנא <span class=lightYellow>המתן</span> שהמשחק הזה ייטען... זה בהחלט שווה את זה!",
        surveySound: "!אנא עזור! איך היית מדרג את הסאונד במשחק הזה? לדוגמה, אם יש מוזיקה, האם אתה אוהב אותה?",
        touchDesktopWarning: "שים לב: משחק זה מיועד לעבודה על מחשבים עם מקלדת ועכבר. נראה שאתה משתמש במכשיר נייד. הקש <span class=orange>כאן</span> כדי לשחק במשחק נהדר אחר באתר זה.",
    },
    hi: {
        thankyou: "धन्यवाद!",
        oldGame: "यह एक अनमोल पुराना गेम है जिसे हम यादों को जीवित रखने के लिए उपलब्ध करा रहे हैं। इसमें कोई विज्ञापन नहीं हैं। आनंद लें!",
        helpWithTranslation: "क्या आप हिंदी बोलते हैं? ऊपर दिए गए गेम का विवरण अंग्रेजी से स्वचालित रूप से अनुवादित किया गया था। क्या यह आपको अच्छा लगता है? कृपया वोट करके हमारी मदद करें!",
        waitLoading: "कृपया इस गेम के लोड होने के लिए <span class=lightYellow>प्रतीक्षा</span> करें... यह इसके लायक है!",
        surveySound: "कृपया मदद करें! आप इस गेम में ध्वनि को कैसे रेट करेंगे? उदाहरण के लिए, यदि संगीत है, तो क्या आपको यह पसंद है?",
        touchDesktopWarning: "ध्यान दें: यह गेम कीबोर्ड और माउस वाले कंप्यूटरों पर काम करने के लिए डिज़ाइन किया गया है। ऐसा लगता है कि आप एक मोबाइल डिवाइस का उपयोग कर रहे हैं। इस साइट पर एक और शानदार गेम खेलने के लिए <span class=orange>यहां</span> टैप करें।",
    },
    hr: {
        thankyou: "Hvala vam!",
        oldGame: "Ovo je dragocjena stara igra koju stavljamo na raspolaganje kako bismo sačuvali uspomene. Nema oglasa. Uživajte!",
        helpWithTranslation: "Govorite li hrvatski? Gornji opis igre automatski je preveden s engleskog. Čini li vam se dobrim? Molimo vas da nam pomognete glasovanjem!",
        waitLoading: "Molimo <span class=lightYellow>PRIČEKAJTE</span> da se ova igra učita... itekako se isplati!",
        surveySound: "Molimo vas pomozite! Kako biste ocijenili zvuk u ovoj igri? Na primjer, ako ima glazbe, sviđa li vam se?",
        touchDesktopWarning: "Obavijest: Ova je igra dizajnirana za rad na računalima s tipkovnicom i mišem. Čini se da koristite mobilni uređaj. Dodirnite <span class=orange>ovdje</span> da biste zaigrali drugu sjajnu igru na ovoj web stranici.",
    },
    hu: {
        thankyou: "Köszönöm!",
        oldGame: "Ez egy becses régi játék, amelyet azért teszünk elérhetővé, hogy megőrizzük az emlékeket. Nincsenek hirdetések. Jó szórakozást!",
        helpWithTranslation: "Beszél magyarul? A fenti játékleírást automatikusan fordították angolról. Jónak tűnik Önnek? Kérjük, segítsen nekünk szavazással!",
        waitLoading: "Kérjük, <span class=lightYellow>VÁRJON</span>, amíg ez a játék betöltődik... nagyon megéri!",
        surveySound: "Kérjük, segítsen! Hogyan értékelné a hangot ebben a játékban? Például, ha van zene, tetszik Önnek?",
        touchDesktopWarning: "Figyelem: Ezt a játékot billentyűzettel és egérrel rendelkező számítógépeken való használatra tervezték. Úgy tűnik, hogy Ön mobil eszközt használ. Koppintson <span class=orange>ide</span> egy másik nagyszerű játék lejátszásához ezen az oldalon.",
    },
    hy: {
        thankyou: "Շնորհակալություն!",
        oldGame: "Սա հին, գնահատված խաղ է, որը մենք հասանելի ենք դարձնում հիշողությունները կենդանի պահելու համար։ Գովազդներ չկան։ Վայելեք!",
        helpWithTranslation: "Դուք խոսո՞ւմ եք հայերեն։ Վերևի խաղի նկարագրությունը ավտոմատ կերպով թարգմանվել է անգլերենից։ Այն լավ տպավորությո՞ւն է թողնում ձեզ վրա։ Խնդրում ենք օգնել մեզ քվեարկելով:",
        waitLoading: "Խնդրում ենք <span class=lightYellow>ՍՊԱՍԵՔ</span> այս խաղի բեռնավորմանը... այն լիովին արժե այն!",
        surveySound: "Խնդրում ենք օգնեք։ Ինչպե՞ս կգնահատեք այս խաղի ձայնը։ Օրինակ՝ եթե երաժշտություն կա, այն ձեզ դուր գա՞լիս է:",
        touchDesktopWarning: "Ծանուցում. Այս խաղը նախատեսված է ստեղնաշարով և մկնիկով համակարգիչների վրա աշխատելու համար։ Թվում է, թե դուք օգտագործում եք շարժական սարք։ Սեղմեք <span class=orange>այստեղ</span> այս կայքում մեկ այլ հիանալի խաղ խաղալու համար։",
    },
    id: {
        thankyou: "Terima kasih!",
        oldGame: "Ini adalah game lama berharga yang kami sediakan untuk menjaga kenangan tetap hidup. Tidak ada iklan. Selamat menikmati!",
        helpWithTranslation: "Apakah Anda berbicara bahasa Indonesia? Deskripsi game di atas diterjemahkan secara otomatis dari bahasa Inggris. Apakah menurut Anda bagus? Mohon bantu kami dengan memberikan suara!",
        waitLoading: "Harap <span class=lightYellow>TUNGGU</span> game ini dimuat ... ini sangat berharga!",
        surveySound: "Tolong bantu! Bagaimana Anda menilai suara dalam game ini? Misalnya, jika ada musik, apakah Anda menyukainya?",
        touchDesktopWarning: "Pemberitahuan: Game ini dirancang untuk berfungsi di komputer dengan keyboard dan mouse. Sepertinya Anda menggunakan perangkat seluler. Ketuk <span class=orange>di sini</span> untuk memainkan game hebat lainnya di situs ini.",
    },
    it: {
        thankyou: "Grazie!",
        oldGame: "Questo è un vecchio gioco prezioso che mettiamo a disposizione per mantenere vivi i ricordi. Non ci sono pubblicità. Divertiti!",
        helpWithTranslation: "Parli italiano? La descrizione del gioco qui sopra è stata tradotta automaticamente dall'inglese. Ti sembra buona? Aiutaci votando!",
        waitLoading: "Per favore <span class=lightYellow>ATTENDI</span> che questo gioco si carichi... ne vale la pena!",
        surveySound: "Per favore, aiutaci! Come valuteresti il suono in questo gioco? Ad esempio, se c'è musica, ti piace?",
        touchDesktopWarning: "Avviso: Questo gioco è progettato per funzionare su computer con tastiera e mouse. Sembra che tu stia usando un dispositivo mobile. Tocca <span class=orange>qui</span> per giocare a un altro fantastico gioco su questo sito.",
    },
    ja: {
        thankyou: "ありがとうございます！",
        oldGame: "これは思い出を生き続けるために提供している、大切にされてきた古いゲームです。広告はありません。お楽しみください！",
        helpWithTranslation: "日本語を話せますか？上記のゲームの説明は英語から自動的に翻訳されました。良いと思われますか？投票して私たちを助けてください！",
        waitLoading: "このゲームがロードされるまで<span class=lightYellow>お待ちください</span>…きっとそれだけの価値はあります！",
        surveySound: "ご協力ください！このゲームのサウンドをどのように評価しますか？たとえば、音楽がある場合、それは好きですか？",
        touchDesktopWarning: "注意：このゲームはキーボードとマウスを備えたコンピューターで動作するように設計されています。モバイルデバイスを使用しているようです。このサイトで別の素晴らしいゲームをプレイするには、<span class=orange>ここ</span>をタップしてください。",
    },
    ka: {
        thankyou: "გმადლობთ!",
        oldGame: "ეს არის ძვირფასი ძველი თამაში, რომელსაც ხელმისაწვდომს ვხდით მოგონებების შესანარჩუნებლად. რეკლამები არ არის. ისიამოვნეთ!",
        helpWithTranslation: "ლაპარაკობთ ქართულად? ზემოთ მოცემული თამაშის აღწერა ავტომატურად ითარგმნა ინგლისურიდან. მოგწონთ? გთხოვთ, დაგვეხმაროთ ხმის მიცემით!",
        waitLoading: "გთხოვთ, <span class=lightYellow>დაელოდოთ</span> ამ თამაშის ჩატვირთვას... ეს ნამდვილად ღირს!",
        surveySound: "გთხოვთ დახმარება! როგორ შეაფასებდით ამ თამაშის ხმას? მაგალითად, თუ არის მუსიკა, მოგწონთ ის?",
        touchDesktopWarning: "შენიშვნა: ეს თამაში შექმნილია კლავიატურითა და მაუსით აღჭურვილ კომპიუტერებზე სამუშაოდ. როგორც ჩანს, თქვენ იყენებთ მობილურ მოწყობილობას. დააჭირეთ <span class=orange>აქ</span> ამ საიტზე სხვა შესანიშნავი თამაშის სათამაშოდ.",
    },
    ko: {
        thankyou: "감사합니다!",
        oldGame: "이것은 소중한 추억을 간직하기 위해 제공되는 오래된 게임입니다. 광고는 없습니다. 즐기세요!",
        helpWithTranslation: "한국어를 할 줄 아세요? 위의 게임 설명은 영어에서 자동으로 번역되었습니다. 보기에 괜찮습니까? 투표하여 저희를 도와주세요!",
        waitLoading: "이 게임이 로드될 때까지 <span class=lightYellow>기다려</span> 주세요... 정말 그만한 가치가 있습니다!",
        surveySound: "도와주세요! 이 게임의 사운드를 어떻게 평가하시겠습니까? 예를 들어 음악이 있다면 마음에 드시나요?",
        touchDesktopWarning: "알림: 이 게임은 키보드와 마우스가 있는 컴퓨터에서 작동하도록 설계되었습니다. 모바일 장치를 사용하고 있는 것 같습니다. <span class=orange>여기</span>를 탭하여 이 사이트에서 다른 멋진 게임을 플레이하세요.",
    },
    lt: {
        thankyou: "Ačiū!",
        oldGame: "Tai yra brangus senas žaidimas, kurį padarome prieinamą, kad išsaugotume prisiminimus. Jame nėra reklamų. Mėgaukitės!",
        helpWithTranslation: "Ar kalbate lietuviškai? Aukščiau pateiktas žaidimo aprašymas buvo automatiškai išverstas iš anglų kalbos. Ar jis jums atrodo geras? Prašome padėti mums balsuodami!",
        waitLoading: "Prašome <span class=lightYellow>PALAUKE</span>, kol šis žaidimas įsikraus... jis tikrai vertas to!",
        surveySound: "Prašome padėti! Kaip vertintumėte šio žaidimo garsą? Pavyzdžiui, jei yra muzika, ar ji jums patinka?",
        touchDesktopWarning: "Pranešimas: Šis žaidimas sukurtas veikti kompiuteriuose su klaviatūra ir pele. Atrodo, kad naudojate mobilųjį įrenginį. Bakstelėkite <span class=orange>čia</span>, kad žaistumėte kitą puikų žaidimą šioje svetainėje.",
    },
    lv: {
        thankyou: "Paldies!",
        oldGame: "Šī ir dārga veca spēle, ko mēs padarām pieejamu, lai saglabātu atmiņas. Tajā nav reklāmu. Izbaudi!",
        helpWithTranslation: "Vai jūs runājat latviski? Augšā sniegtais spēles apraksts tika automātiski tulkots no angļu valodas. Vai tas jums šķiet labs? Lūdzu, palīdziet mums, balsojot!",
        waitLoading: "Lūdzu, <span class=lightYellow>GAIDIET</span>, kamēr šī spēle ielādēsies... tas ir tā vērts!",
        surveySound: "Lūdzu, palīdziet! Kā jūs vērtētu skaņu šajā spēlē? Piemēram, ja ir mūzika, vai tā jums patīk?",
        touchDesktopWarning: "Paziņojums: Šī spēle ir paredzēta darbam datoros ar tastatūru un peli. Izskatās, ka jūs izmantojat mobilo ierīci. Pieskarieties <span class=orange>šeit</span>, lai spēlētu citu lielisku spēli šajā vietnē.",
    },
    mk: {
        thankyou: "Благодарам!",
        oldGame: "Ова е драгоцена стара игра што ја правиме достапна за да ги зачуваме спомените. Нема реклами. Уживајте!",
        helpWithTranslation: "Дали зборувате македонски? Горенаведениот опис на играта беше автоматски преведен од англиски. Ви се чини добар? Ве молиме помогнете ни со гласање!",
        waitLoading: "Ве молиме <span class=lightYellow>ПОЧЕКАЈТЕ</span> додека оваа игра се вчита... вреди!",
        surveySound: "Ве молиме помогнете! Како би го оцениле звукот во оваа игра? На пример, ако има музика, дали ви се допаѓа?",
        touchDesktopWarning: "Известување: Оваа игра е дизајнирана да работи на компјутери со тастатура и глушец. Изгледа користите мобилен уред. Допрете <span class=orange>овде</span> за да играте друга одлична игра на оваа страница.",
    },
    ms: {
        thankyou: "Terima kasih!",
        oldGame: "Ini ialah permainan lama yang berharga yang kami sediakan untuk mengekalkan kenangan. Tiada iklan. Nikmati!",
        helpWithTranslation: "Adakah anda bercakap Bahasa Melayu? Penerangan permainan di atas diterjemahkan secara automatik daripada Bahasa Inggeris. Adakah ia kelihatan baik kepada anda? Sila bantu kami dengan mengundi!",
        waitLoading: "Sila <span class=lightYellow>TUNGGU</span> permainan ini dimuatkan ... ia sangat berbaloi!",
        surveySound: "Tolong bantu! Bagaimanakah anda menilai bunyi dalam permainan ini? Contohnya, jika ada muzik, adakah anda menyukainya?",
        touchDesktopWarning: "Notis: Permainan ini direka untuk berfungsi pada komputer dengan papan kekunci dan tetikus. Nampaknya anda menggunakan peranti mudah alih. Ketik <span class=orange>di sini</span> untuk bermain permainan hebat lain di laman web ini.",
    },
    nb: {
        thankyou: "Takk!",
        oldGame: "Dette er et kjært gammelt spill vi gjør tilgjengelig for å holde minnene i live. Det er ingen annonser. Kos deg!",
        helpWithTranslation: "Snakker du norsk? Spillbeskrivelsen ovenfor ble automatisk oversatt fra engelsk. Synes du den ser bra ut? Vennligst hjelp oss ved å stemme!",
        waitLoading: "Vennligst <span class=lightYellow>VENT</span> mens spillet laster ... det er vel verdt det!",
        surveySound: "Vennligst hjelp! Hvordan vil du vurdere lyden i dette spillet? For eksempel, hvis det er musikk, liker du den?",
        touchDesktopWarning: "Merknad: Dette spillet er designet for å fungere på datamaskiner med tastatur og mus. Det ser ut som du bruker en mobil enhet. Trykk <span class=orange>her</span> for å spille et annet flott spill på dette nettstedet.",
    },
    nl: {
        thankyou: "Dank u wel!",
        oldGame: "Dit is een gekoesterd oud spel dat we beschikbaar stellen om herinneringen levend te houden. Er zijn geen advertenties. Geniet ervan!",
        helpWithTranslation: "Spreekt u Nederlands? De bovenstaande speluitleg is automatisch vanuit het Engels vertaald. Ziet het er goed uit? Help ons alstublieft door te stemmen!",
        waitLoading: "Even <span class=lightYellow>WACHTEN</span> totdat dit spel geladen is... het is het zeker waard!",
        surveySound: "Alstublieft helpen! Hoe zou u het geluid in dit spel beoordelen? Bijvoorbeeld, als er muziek is, vindt u het dan leuk?",
        touchDesktopWarning: "Let op: Dit spel is ontworpen om te werken op computers met een toetsenbord en muis. Het lijkt erop dat u een mobiel apparaat gebruikt. Tik <span class=orange>hier</span> om een ander geweldig spel op deze site te spelen.",
    },
    pl: {
        thankyou: "Dziękuję!",
        oldGame: "To cenna stara gra, którą udostępniamy, aby zachować wspomnienia. Nie ma reklam. Baw się dobrze!",
        helpWithTranslation: "Czy mówisz po polsku? Powyższy opis gry został automatycznie przetłumaczony z języka angielskiego. Czy wydaje Ci się dobry? Pomóż nam, głosując!",
        waitLoading: "Proszę <span class=lightYellow>POCZEKAĆ</span>, aż ta gra się załaduje... naprawdę warto!",
        surveySound: "Proszę o pomoc! Jak oceniasz dźwięk w tej grze? Na przykład, jeśli jest muzyka, czy Ci się podoba?",
        touchDesktopWarning: "Uwaga: Ta gra jest przeznaczona do działania na komputerach z klawiaturą i myszą. Wygląda na to, że używasz urządzenia mobilnego. Kliknij <span class=orange>tutaj</span>, aby zagrać w inną świetną grę na tej stronie.",
    },
    pt: {
        thankyou: "Obrigado!",
        oldGame: "Este é um jogo antigo e valioso que estamos a disponibilizar para manter as memórias vivas. Não há anúncios. Aproveite!",
        helpWithTranslation: "Você fala português? A descrição do jogo acima foi traduzida automaticamente do inglês. Parece-lhe boa? Por favor, ajude-nos votando!",
        waitLoading: "Por favor, <span class=lightYellow>ESPERE</span> que este jogo carregue... vale muito a pena!",
        surveySound: "Por favor, ajude! Como você avaliaria o som neste jogo? Por exemplo, se houver música, você gosta?",
        touchDesktopWarning: "Aviso: Este jogo foi projetado para funcionar em computadores com teclado e mouse. Parece que você está usando um dispositivo móvel. Toque <span class=orange>aqui</span> para jogar outro ótimo jogo neste site.",
    },
    ro: {
        thankyou: "Mulțumesc!",
        oldGame: "Acesta este un joc vechi prețuit pe care îl facem disponibil pentru a păstra amintirile vii. Nu există reclame. Bucurați-vă!",
        helpWithTranslation: "Vorbiți română? Descrierea jocului de mai sus a fost tradusă automat din engleză. Vi se pare bună? Vă rugăm să ne ajutați votând!",
        waitLoading: "Vă rugăm să <span class=lightYellow>AȘTEPTAȚI</span> ca acest joc să se încarce... merită!",
        surveySound: "Vă rugăm să ajutați! Cum ați evalua sunetul din acest joc? De exemplu, dacă există muzică, vă place?",
        touchDesktopWarning: "Notificare: Acest joc este conceput să funcționeze pe computere cu tastatură și mouse. Se pare că folosiți un dispozitiv mobil. Apăsați <span class=orange>aici</span> pentru a juca un alt joc grozav pe acest site.",
    },
    ru: {
        thankyou: "Спасибо!",
        oldGame: "Это ценная старая игра, которую мы делаем доступной, чтобы сохранить воспоминания. Здесь нет рекламы. Наслаждайтесь!",
        helpWithTranslation: "Вы говорите по-русски? Описание игры выше было автоматически переведено с английского языка. Оно кажется вам хорошим? Пожалуйста, помогите нам, проголосовав!",
        waitLoading: "Пожалуйста, <span class=lightYellow>ПОДОЖДИТЕ</span>, пока эта игра загрузится... это того стоит!",
        surveySound: "Пожалуйста, помогите! Как бы вы оценили звук в этой игре? Например, если есть музыка, нравится ли она вам?",
        touchDesktopWarning: "Внимание: Эта игра разработана для работы на компьютерах с клавиатурой и мышью. Похоже, вы используете мобильное устройство. Нажмите <span class=orange>здесь</span>, чтобы сыграть в другую отличную игру на этом сайте.",
    },
    sk: {
        thankyou: "Ďakujem!",
        oldGame: "Toto je vzácna stará hra, ktorú sprístupňujeme, aby sme zachovali spomienky. Neobsahuje žiadne reklamy. Užite si ju!",
        helpWithTranslation: "Hovoríte po slovensky? Vyššie uvedený popis hry bol automaticky preložený z angličtiny. Zdá sa vám dobrý? Prosím, pomôžte nám hlasovaním!",
        waitLoading: "Prosím, <span class=lightYellow>POČKAJTE</span>, kým sa táto hra načíta... naozaj sa oplatí!",
        surveySound: "Prosím, pomôžte! Ako by ste ohodnotili zvuk v tejto hre? Napríklad, ak je tam hudba, páči sa vám?",
        touchDesktopWarning: "Upozornenie: Táto hra je navrhnutá pre prácu na počítačoch s klávesnicou a myšou. Vyzerá to, že používate mobilné zariadenie. Klepnite <span class=orange>sem</span> a zahrajte si ďalšiu skvelú hru na tejto stránke.",
    },
    sl: {
        thankyou: "Hvala!",
        oldGame: "To je dragocena stara igra, ki jo dajemo na voljo, da ohranimo spomine. Ni oglasov. Uživajte!",
        helpWithTranslation: "Ali govorite slovensko? Zgornji opis igre je bil samodejno preveden iz angleščine. Se vam zdi dober? Prosimo, pomagajte nam z glasovanjem!",
        waitLoading: "Prosimo, <span class=lightYellow>POČAKAJTE</span>, da se ta igra naloži ... resnično se splača!",
        surveySound: "Prosimo, pomagajte! Kako bi ocenili zvok v tej igri? Na primer, če je glasba, ali vam je všeč?",
        touchDesktopWarning: "Obvestilo: Ta igra je zasnovana za delo na računalnikih s tipkovnico in miško. Zdi se, da uporabljate mobilno napravo. Tapnite <span class=orange>tukaj</span>, da igrate drugo odlično igro na tem spletnem mestu.",
    },
    sq: {
        thankyou: "Faleminderit!",
        oldGame: "Kjo është një lojë e vjetër e çmuar që po e bëjmë të disponueshme për të mbajtur gjallë kujtimet. Nuk ka reklama. Shijojeni!",
        helpWithTranslation: "A flisni Shqip? Përshkrimi i lojës më sipër u përkthye automatikisht nga anglishtja. Ju duket i mirë? Ju lutemi na ndihmoni duke votuar!",
        waitLoading: "Ju lutemi <span class=lightYellow>PRISNI</span> që kjo lojë të ngarkohet ...ia vlen!",
        surveySound: "Ju lutemi ndihmoni! Si do ta vlerësonit zërin në këtë lojë? Për shembull, nëse ka muzikë, a ju pëlqen?",
        touchDesktopWarning: "Njoftim: Kjo lojë është krijuar për të punuar në kompjuterë me tastierë dhe maus. Duket se po përdorni një pajisje mobile. Prekni <span class=orange>këtu</span> për të luajtur një lojë tjetër të shkëlqyer në këtë faqe.",
    },
    sr: {
        thankyou: "Хвала вам!",
        oldGame: "Ово је драгоцена стара игра коју чинимо доступном да бисмо сачували сећања. Нема реклама. Уживајте!",
        helpWithTranslation: "Да ли говорите српски? Горе наведени опис игре је аутоматски преведен са енглеског. Да ли вам се чини добар? Молимо вас да нам помогнете гласањем!",
        waitLoading: "Молимо <span class=lightYellow>САЧЕКАЈТЕ</span> да се ова игра учита ...вреди чекања!",
        surveySound: "Молимо вас за помоћ! Како бисте оценили звук у овој игри? На пример, ако има музике, да ли вам се свиђа?",
        touchDesktopWarning: "Напомена: Ова игра је дизајнирана да ради на рачунарима са тастатуром и мишем. Изгледа да користите мобилни уређај. Додирните <span class=orange>овде</span> да бисте играли другу одличну игру на овом сајту.",
    },
    sv: {
        thankyou: "Tack!",
        oldGame: "Detta är ett kärt gammalt spel som vi gör tillgängligt för att hålla minnen vid liv. Det finns inga annonser. Njut!",
        helpWithTranslation: "Talar du Svenska? Spelbeskrivningen ovan översattes automatiskt från engelska. Tycker du att den verkar bra? Hjälp oss gärna genom att rösta!",
        waitLoading: "Vänligen <span class=lightYellow>VÄNTA</span> medan spelet laddas ...det är väl värt det!",
        surveySound: "Snälla hjälp! Hur skulle du betygsätta ljudet i det här spelet? Till exempel, om det finns musik, gillar du den?",
        touchDesktopWarning: "Observera: Det här spelet är designat för att fungera på datorer med tangentbord och mus. Det ser ut som att du använder en mobil enhet. Tryck <span class=orange>här</span> för att spela ett annat bra spel på den här webbplatsen.",
    },
    tl: {
        thankyou: "Salamat!",
        oldGame: "Ito ay isang mahalagang lumang laro na ginagawa naming magagamit upang mapanatiling buhay ang mga alaala. Walang mga ad. Mag-enjoy!",
        helpWithTranslation: "Nagsasalita ka ba ng Tagalog? Ang paglalarawan ng laro sa itaas ay awtomatikong isinalin mula sa Ingles. Mukha bang mahusay ito sa iyo? Mangyaring tulungan kami sa pamamagitan ng pagboto!",
        waitLoading: "Pakiusap <span class=lightYellow>MAGHINTAY</span> habang naglo-load ang larong ito ...sulit ito!",
        surveySound: "Pakiusap tulungan! Paano mo irarating ang tunog sa larong ito? Halimbawa, kung may musika, gusto mo ba ito?",
        touchDesktopWarning: "Paunawa: Ang larong ito ay idinisenyo upang gumana sa mga computer na may keyboard at mouse. Mukhang gumagamit ka ng mobile device. I-tap <span class=orange>dito</span> upang maglaro ng isa pang magandang laro sa site na ito.",
    },
    th: {
        thankyou: "ขอบคุณ!",
        oldGame: "นี่คือเกมเก่าแก่ที่เรานำมาให้เล่นเพื่อคงความทรงจำไว้ จะไม่มีโฆษณา ขอให้สนุก!",
        helpWithTranslation: "คุณพูดภาษาไทยไหม? คำอธิบายเกมด้านบนได้รับการแปลโดยอัตโนมัติจากภาษาอังกฤษ คุณคิดว่ามันดีหรือไม่? โปรดช่วยเราโหวต!",
        waitLoading: "โปรด <span class=lightYellow>รอ</span> ให้เกมนี้โหลด ...คุ้มค่าแน่นอน!",
        surveySound: "โปรดช่วยหน่อย! คุณให้คะแนนเสียงในเกมนี้อย่างไร? ตัวอย่างเช่น ถ้ามีเพลง คุณชอบไหม?",
        touchDesktopWarning: "หมายเหตุ: เกมนี้ออกแบบมาให้ทำงานบนคอมพิวเตอร์ที่มีคีย์บอร์ดและเมาส์ ดูเหมือนว่าคุณกำลังใช้อุปกรณ์เคลื่อนที่ แตะ <span class=orange>ที่นี่</span> เพื่อเล่นเกมสนุก ๆ อื่น ๆ บนเว็บไซต์นี้",
    },
    tr: {
        thankyou: "Teşekkürler!",
        oldGame: "Bu, anıları yaşatmak için kullanıma sunduğumuz değerli bir eski oyun. Reklam yok. Tadını çıkarın!",
        helpWithTranslation: "Türkçe konuşuyor musunuz? Yukarıdaki oyun açıklaması İngilizce'den otomatik olarak çevrildi. Size iyi görünüyor mu? Lütfen oy vererek bize yardımcı olun!",
        waitLoading: "Lütfen bu oyunun yüklenmesi için <span class=lightYellow>BEKLEYİN</span> ...kesinlikle değer!",
        surveySound: "Lütfen yardım edin! Bu oyundaki sesi nasıl değerlendirirsiniz? Örneğin, müzik varsa, hoşunuza gidiyor mu?",
        touchDesktopWarning: "Uyarı: Bu oyun klavye ve fare ile çalışan bilgisayarlar için tasarlanmıştır. Bir mobil cihaz kullanıyor gibi görünüyorsunuz. Bu sitede başka bir harika oyun oynamak için <span class=orange>buraya</span> dokunun.",
    },
    uk: {
        thankyou: "Дякую!",
        oldGame: "Це цінна стара гра, яку ми робимо доступною, щоб зберегти спогади. Тут немає реклами. Насолоджуйтесь!",
        helpWithTranslation: "Ви розмовляєте українською? Опис гри вище було автоматично перекладено з англійської. Він здається вам хорошим? Будь ласка, допоможіть нам, проголосувавши!",
        waitLoading: "Будь ласка, <span class=lightYellow>ЗАЧЕКАЙТЕ</span> завантаження цієї гри ...вона того варта!",
        surveySound: "Будь ласка, допоможіть! Як би ви оцінили звук у цій грі? Наприклад, якщо є музика, чи подобається вона вам?",
        touchDesktopWarning: "Примітка: Ця гра розроблена для роботи на комп'ютерах з клавіатурою та мишею. Схоже, ви використовуєте мобільний пристрій. Натисніть <span class=orange>тут</span>, щоб зіграти в іншу чудову гру на цьому сайті.",
    },
    ur: {
        thankyou: "شکریہ!",
        oldGame: "یہ ایک قیمتی پرانا گیم ہے جسے ہم یادوں کو زندہ رکھنے کے لیے دستیاب کروا رہے ہیں۔ اس میں کوئی اشتہار نہیں ہے۔ لطف اٹھائیں!",
        helpWithTranslation: "کیا آپ اردو بولتے ہیں؟ اوپر دی گئی گیم کی تفصیل انگریزی سے خود بخود ترجمہ کی گئی ہے۔ کیا یہ آپ کو اچھی لگتی ہے؟ براہ کرم ووٹ دے کر ہماری مدد کریں!",
        waitLoading: "براہ کرم اس گیم کے لوڈ ہونے کا <span class=lightYellow>انتظار کریں</span>... یہ اس کے قابل ہے!",
        surveySound: "براہ کرم مدد کریں! آپ اس گیم میں آواز کی درجہ بندی کیسے کریں گے؟ مثال کے طور پر، اگر موسیقی ہے، تو کیا آپ کو یہ پسند ہے؟",
        touchDesktopWarning: "نوٹ: یہ گیم کی بورڈ اور ماؤس والے کمپیوٹرز پر کام کرنے کے لیے بنائی گئی ہے۔ ایسا لگتا ہے کہ آپ موبائل ڈیوائس استعمال کر رہے ہیں۔ اس سائٹ پر کوئی اور بہترین گیم کھیلنے کے لیے <span class=orange>یہاں</span> ٹیپ کریں۔",
    },
    uz: {
        thankyou: "Rahmat!",
        oldGame: "Bu xotiralarni saqlab qolish uchun taqdim etilayotgan qimmatbaho eski o'yin. Reklamalar yo'q. Maroqli o'yin!",
        helpWithTranslation: "O'zbek tilida gapirasizmi? Yuqoridagi o'yin tavsifi ingliz tilidan avtomatik tarjima qilindi. Sizga yaxshi ko'rinyaptimi? Iltimos, ovoz berish orqali bizga yordam bering!",
        waitLoading: "Iltimos, bu o'yin yuklanishini <span class=lightYellow>KUTING</span> ...bunga arziydi!",
        surveySound: "Iltimos, yordam bering! Bu o'yindagi ovozni qanday baholaysiz? Misol uchun, agar musiqa bo'lsa, u sizga yoqadimi?",
        touchDesktopWarning: "Eslatma: Bu o'yin klaviatura va sichqoncha bilan ishlaydigan kompyuterlar uchun mo'ljallangan. Ko'rinishidan siz mobil qurilmadan foydalanayotgan ko'rinasiz. Bu saytdagi boshqa ajoyib o'yinni o'ynash uchun <span class=orange>bu yerga</span> bosing.",
    },
    vi: {
        thankyou: "Cảm ơn bạn!",
        oldGame: "Đây là một trò chơi cũ quý giá mà chúng tôi cung cấp để giữ gìn những kỷ niệm. Không có quảng cáo. Chúc bạn thưởng thức!",
        helpWithTranslation: "Bạn có nói tiếng Việt không? Phần mô tả trò chơi ở trên đã được dịch tự động từ tiếng Anh. Bạn thấy nó có ổn không? Xin hãy giúp chúng tôi bằng cách bình chọn!",
        waitLoading: "Vui lòng <span class=lightYellow>ĐỢI</span> trò chơi này tải ...rất đáng để chờ đợi!",
        surveySound: "Xin hãy giúp đỡ! Bạn đánh giá âm thanh trong trò chơi này như thế nào? Ví dụ, nếu có nhạc, bạn có thích nó không?",
        touchDesktopWarning: "Lưu ý: Trò chơi này được thiết kế để hoạt động trên máy tính có bàn phím và chuột. Có vẻ như bạn đang sử dụng thiết bị di động. Nhấn <span class=orange>vào đây</span> để chơi một trò chơi tuyệt vời khác trên trang web này.",
    },
    zh: {
        thankyou: "谢谢！",
        oldGame: "这是一个我们珍藏的旧游戏，现在提供出来是为了留存记忆。没有广告，请尽情享受！",
        helpWithTranslation: "您会说中文吗？上面的游戏描述是从英文自动翻译过来的。您觉得怎么样？请投票帮助我们！",
        waitLoading: "请<span class=lightYellow>等待</span>此游戏加载...绝对值得！",
        surveySound: "请帮忙！您如何评价这款游戏的声音？例如，如果有音乐，您喜欢吗？",
        touchDesktopWarning: "注意：本游戏设计用于带有键盘和鼠标的电脑。您似乎正在使用移动设备。请<span class=orange>点击此处</span>在本网站上玩另一款精彩的游戏。",
    }
};

//dressup counter
var z = localStorage.getItem('dressupCounter');
if (z === null) {
    z = 0;
}

dressupCounter = z;

if (game.dressup) {
    dressupCounter++;
    localStorage.setItem("dressupCounter", dressupCounter);
    console.log("cookie dressupCounter increment");
}

console.log("cookie dressupCounter: " + dressupCounter);



var isSchool = false;
if (window.location.hostname.indexOf("school") > -1 || window.location.hostname.indexOf("math") > -1) {
    isSchool = true;
}

if (game.title.length > 28) {
    infoBoxTitle.style.fontSize = "5vmax";
}

gameMB.innerHTML = game.loadingSizeMB + "MB";

var mSpecial = false;

if (game.title.indexOf("inecra") > -1) {
    mSpecial = true;
}

var cSpecial = false;

if (game.title.indexOf("Code B") > -1) {
    cSpecial = true;
}






//GET OPERATING SYSTEM
//////////////////////

var os = "Other";

var hasTouchPoints = false;
if (navigator.maxTouchPoints > 0) {
    hasTouchPoints = true;
}

var userAgent = navigator.userAgent || navigator.vendor || window.opera;

function getAndroidVersion() {
    var match = userAgent.toLowerCase().match(/android\s([0-9\.]*)/i);
    return match ? parseInt(match[1], 10) : false;
};

function getOperatingSystem() {
    if (/android/i.test(userAgent) && hasTouchPoints) {
        return "Android";
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }
    if (navigator.platform === 'MacIntel' && hasTouchPoints) { //newer iPads
        return "iOS";
    }
    return "Desktop"; //default - will be mostly pcs, macs, linux desktop etc.
}

var os = getOperatingSystem();

if (debug) {
    os = "Android"; //spoof os
}

var shortOS = "OTR";

if (os == "Desktop") { //further sub divide...

    if (userAgent.indexOf("Windows NT 10.0") != -1) {
        //console.log("OS is Windows 10 or 11");
        os += "-winNewest";
        shortOS = "WNN";
    }

    if (userAgent.indexOf("Windows NT 6.") != -1) { //8.1 or 8.0 or 7.0
        //console.log("OS is Windows 7 or 8");
        os += "-win7-8";
        shortOS = "W78";
    }

    if (userAgent.indexOf("Mac") != -1) {
        //console.log("OS is MacOS");
        os += "-macOS";
        shortOS = "MOS";
    }

    if (userAgent.indexOf("CrOS") != -1) {
        //console.log("OS is Chrome OS");
        os += "-chromeOS";
        shortOS = "CRO";
    }

    if (os == "Desktop") { //if still only "Desktop"
        //console.log("OS is unknown Desktop - likely Linux");
        os = "Desktop-other";
        shortOS = "DTO";
    }

}

var touchDevice = false; // could use...  typeof window.orientation == "undefined"
if ((os == "Android" && hasTouchPoints) || os == "iOS") {
    touchDevice = true;
}


if (debug) {
    touchDevice = false; //spoof touchdevice
}








/*
//windows version
var windows10 = false;
var windows11 = false;

navigator.userAgentData.getHighEntropyValues(["platformVersion"])
    .then(ua => {
        if (navigator.userAgentData.platform === "Windows") {
            const majorPlatformVersion = parseInt(ua.platformVersion.split('.')[0]);
            if (majorPlatformVersion >= 13) {
                console.log("Windows 11 or later");
                windows11 = true;
            } else if (majorPlatformVersion > 0) {
                console.log("Windows 10");
                windows10 = true;
            } else {
                console.log("Before Windows 10");
            }
        } else {
            console.log("Not running on Windows");
        }
    });

//console.log("immediate windows10: " + windows10);
//console.log("immediate windows11: " + windows11);
*/

var devory = false;

if (window.location.href.indexOf("?d") > -1) {
    devory = true;
}

if (!game.showBackButton || os == "iOS" || (devory && Math.random() > 0.1)) {
    backButton.style.display = "none";
}

if (!game.showGameEffectsButton) {
    gameEffectsButton.style.display = "none";
}

if (game.walkthrough == "") {
    walkthroughButton.style.display = "none";
}


//OUTPUT CONTROLS
/////////////////

if (!touchDevice) {
    var controlsString = "";

    if (game.source.indexOf("flashloader") > -1) {
        controlsString += "<div id=flash></div>";
    }
    if (game.controls.indexOf("m") > -1) {
        controlsString += "<div id=mouse></div>";
    }
    if (game.controls.indexOf("g") > -1) {
        controlsString += "<div id=gamepad></div>";
    }
    if (game.controls.indexOf("k") > -1) {
        controlsString += "<div id=keyboard></div>";
    }

    //control changes for french users WASD + TFGH

    if (game.keys.includes("!")) {
        game.keys = game.keys.replace("!", "");

        if (shortLang == "fr") {
            const replacements = [
                {
                    pattern: "wasd",
                    replacement: "wasdtfgh"
                },
                {
                    pattern: "wad",
                    replacement: "wadtfh"
                },
                {
                    pattern: "ad",
                    replacement: "adfh"
                },
                {
                    pattern: "wd",
                    replacement: "wdth"
                },
                {
                    pattern: "ws",
                    replacement: "wstg"
                }
        ];

            for (const rep of replacements) {
                if (game.keys.includes(rep.pattern)) {
                    game.keys = game.keys.replace(rep.pattern, rep.replacement);
                    break; // Stop after the first match
                }
            }
        }
    }

    var i;
    var singleKey = "";
    for (i = 0; i < game.keys.length; i++) {

        var keySize = "";
        singleKey = game.keys.slice(i, i + 1);

        switch (singleKey) {
            case "U":
                singleKey = "&uarr;";
                break;
            case "D":
                singleKey = "&darr;";
                break;
            case "L":
                singleKey = "&larr;";
                break;
            case "R":
                singleKey = "&rarr;";
                break;
            case "S": //spacebar
                singleKey = "_";
                keySize = "Large";
                break;
            case "C": //ctrl
                singleKey = "ctrl";
                keySize = "Large";
                break;
            case "V": //alt-ernatiVe
                singleKey = "alt";
                keySize = "Large";
                break;
            case "E": //enter
                singleKey = "&#8626;";
                keySize = "Medium";
                break;
            case "T": //shift
                singleKey = "&#8679;";
                keySize = "Medium";
                break;
            case "B": //tab
                singleKey = "&#8646;";
                keySize = "Medium";
                break;
            default:
                singleKey = singleKey.toUpperCase(); //if not an arrow key, make the letter uppercase
        }

        controlsString += "<div class=key" + keySize + "><div class=keyCharacter>" + singleKey + "</div></div>"
    }
    infoBoxControls.innerHTML = controlsString;
} else {
    infoBoxControls.style.display = "none";
}

//for long titles
if (game.title.length > 24) {
    infoBoxTitle.style.fontSize = "4vmax";
}

if (game.title.length > 30) {
    infoBoxTitle.style.fontSize = "3.5vmax";
}

if (game.loadingSeconds == "auto") { //if game loadin time is not specified ('auto' is used) then calculate based on game size
    game.loadingSeconds = game.loadingSizeMB;
    if (game.loadingSeconds < 9) {
        game.loadingSeconds = 9;
    }
    if (game.loadingSeconds > 16) {
        game.loadingSeconds = 16;
    }
}
game.loadingSeconds += "s";

spinner.style.animation = "spinner 2s linear forwards infinite, spinnerRemove 0s " + game.loadingSeconds + " linear forwards";
playButton.style.animation = "playButtonShow 0s " + game.loadingSeconds + " linear forwards, shake1 1s 15s cubic-bezier(0.36, 0.07, 0.19, 0.97)";
infoBoxLoadingBar.style.animation = "infoBoxLoadingBar " + game.loadingSeconds + " 1.5s linear forwards";

//fix 'click' and tap' text in description

if (touchDevice) {
    game.enDescription = game.enDescription.replace(/clicking/g, "tapping");
    game.enDescription = game.enDescription.replace(/Clicking/g, "Tapping");
    game.enDescription = game.enDescription.replace(/click/g, "tap");
    game.enDescription = game.enDescription.replace(/Click/g, "Tap");
    game.enDescription = game.enDescription.replace(/clicks/g, "taps");
    game.enDescription = game.enDescription.replace(/Clicks/g, "Taps");
    game.enDescription = game.enDescription.replace(/mouze/g, "finger");
}

game.enDescription = game.enDescription.replace(/mouze/g, "mouse");
game.enDescription = game.enDescription.replace(/OGKA/g, "This is a treasured old game we're making available to keep memories alive. There are no ads. Enjoy!");
game.enDescription = game.enDescription.replace(/JS13K/g, "This extraordinary game was coded in just 13kb for a competition. Genius-level programming. There are no ads. Enjoy!");

if (british) { //us -> british
    game.enDescription = game.enDescription.replace(/Color/g, "Colour");
    game.enDescription = game.enDescription.replace(/color/g, "colour");
    game.enDescription = game.enDescription.replace(/favorite/g, "favourite");
    game.enDescription = game.enDescription.replace(/flavor/g, "flavour");
    game.enDescription = game.enDescription.replace(/armor/g, "armour");
    game.enDescription = game.enDescription.replace(/defense/g, "defence");
    game.enDescription = game.enDescription.replace(/donut/g, "doughnut");
}

//TOUCH-DESKTOP WARNING
///////////////////////

var deviceCompatabilityWarning = "";
var deviceCompatabilityWarningEN = "";
var clickHereURL = "https://www.friv.com/";

if (isSchool) {
    clickHereURL = "https://www.friv4school.com/";
}

if (touchDevice == true && game.desktopOnly) {

    if (localizedText[shortLang]) {
        deviceCompatabilityWarning = "<div class=red><a href='" + clickHereURL + "'>" + localizedText[shortLang].touchDesktopWarning + "</a></div>";
        deviceCompatabilityWarningEN = "<div class=red><a href='" + clickHereURL + "'>" + localizedText["en"].touchDesktopWarning + "</a></div>";
    } else {
        console.warn(`Language code "${unknownLanguage}" not found.`);
    }

}









/////////////////////////////////









var translationHelpRequest = "";

var limitedShortLang = shortLang;

var showingTranslationPrompt = false;

var balancingValue = 0.9;

//if (shortLang == "es") {
//    balancingValue = 0.9;
//}

const languagesToCheck = ["ar", "az", "bg", "bs", "ca", "cs", "da", "de", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu", "hy", "id", "it", "ja", "ka", "ko", "lt", "lv", "mk", "ms", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sq", "sr", "sv", "tl", "th", "tr", "uk", "ur", "uz", "vi", "zh"];

const languagesToCombine = ["az", "bg", "bs", "ca", "cs", "et", "fa", "fi", "hi", "hu", "hy", "ja", "ka", "ko", "lt", "lv", "mk", "ms", "nb", "nl", "sl", "sq", "sr", "sv", "tl", "uk", "ur", "uz", "vi", "zh"]; //combined for now

if (languagesToCombine.includes(shortLang)) {
    limitedShortLang = "xx";
}

if ("esDescription" in game && gamePlays > 6 && game.translationPleaseHelp && languagesToCheck.includes(shortLang) && deviceCompatabilityWarning == "" && Math.random() > balancingValue) { //esDescription used as proxy for all non-en languages

    showingTranslationPrompt = true;

    setTimeout(function () {
        infoBoxTitle.style.cursor = "default";
    }, 500);


    //shortLang = "pl";
    console.log("Will run translation vote rating. shortlang: " + shortLang + " limitedShortlang: " + limitedShortLang);

    translationHelpRequest = "<div id=translationDiv class=cyan>" + localizedText[shortLang].helpWithTranslation + "<br><span id=spare2ThumbsUp>👍</span>&nbsp;&nbsp;&nbsp;&nbsp;<span id=spare2ThumbsDown>👎</span></div>";

    //add listeners when page is loaded
    document.addEventListener('DOMContentLoaded', function () {
        const spare2ThumbsUp = document.getElementById('spare2ThumbsUp'); // Assuming you have IDs
        const spare2ThumbsDown = document.getElementById('spare2ThumbsDown');

        if (spare2ThumbsUp && spare2ThumbsDown) {
            spare2ThumbsUp.addEventListener('click', translationThumbsUp);
            spare2ThumbsDown.addEventListener('click', translationThumbsDown);
        } else {
            console.error("One or both elements not found after DOMContentLoaded");
        }
    });

}

function translationThumbsUp() {

    gtag('event', "TransUpVote-" + limitedShortLang + "-" + gameTitleTruncated);

    console.log("TransUpVote-" + limitedShortLang + "-" + gameTitleTruncated);

    translationDiv.innerHTML = localizedText[shortLang].thankyou;

    setTimeout(function () {
        translationDiv.innerHTML = "&nbsp;";
    }, 3000);

}

function translationThumbsDown() {

    gtag('event', "TransDownVote-" + limitedShortLang + "-" + gameTitleTruncated);

    console.log("TransDownVote-" + limitedShortLang + "-" + gameTitleTruncated);

    translationDiv.innerHTML = localizedText[shortLang].thankyou;

    setTimeout(function () {
        translationDiv.innerHTML = "&nbsp;";
    }, 3000);

}









if (game.translationPleaseHelp && deviceCompatabilityWarning == "") {


}


//GAME LOADING SIZE WARNING
///////////////////////////

var loadingSizeWarning = "";
var loadingSizeWarningEN = "";

if (game.loadingSizeMB > 20 && localizedText[shortLang].waitLoading) {
    loadingSizeWarning = " " + localizedText[shortLang].waitLoading;
    loadingSizeWarningEN = " " + localizedText["en"].waitLoading;
}

//promo of site
var promoText = [
            ["😁 You are on the genuine Friv® - yay! You can be 100% sure when playing " + game.title + " or any of our games, that we'll NEVER interrupt your game to show you an ad. Yay again!"],
            ["😁 Other sites interrupt gameplay and make you sit through video ads. At Friv we'll NEVER do that - it's plain rude. If your friends don't already know about Friv, please tell them!"],
            ["😃 You are smart. You deserve a trophy. 🏆 You are playing " + game.title + " at friv.com where there are no ad interruptions. EVER. If you like Friv, please spread the word. Thank you!"],
            ["😇 We value you. We think you're amazing ...a bit special even. That's why you can play " + game.title + " or any of the games on Friv without any ad interruptions, EVER!"],
            ["😃 We love our loyal users. We want you to enjoy playing " + game.title + " and all our games without ever being nagged. We proudly give you the Friv no in-game ads GUARANTEE! 📝"],
            ["😃 At Friv we love our website but we don't have a lot of money to spend advertising it. If you can, please tell your friends and help the site grow. 📈 Thank you!"],
            ["😂 Please spread the word! Wear a sandwich board reading &quot;I LOVE FRIV!&quot; into town. Or maybe repaint 🖌️ your (Dad's) car with Friv styling! 😉"],
            ["😍 Please spread the word about Friv! Before playing " + game.title + ", kindly throw open your windows and shout &quot;I LOVE FRIV!&quot;."],
            ["😃 If you like Friv and you enjoy playing " + game.title + ", please tell your friends in person, or on WhatsApp / Facebook / Instagram / YouTube / X / TikTok etc. Thank you!"],
            ["😜 Here's something, but you have to keep it WAY more secret than we are. On the Friv menu page, click on the logo 10 times, and you will get extra games!"],
            ["😜 Friv is finally on TikTok! Find us @friv ...we'd be so grateful if you would follow us and like our videos! Thank you!"],
            ["😁 The more people who play on Friv, the more great games we can add. Please tell your friends!"],
            ["😁 Want more games? ...Please tell your friends about Friv. The more players we have, the more great games we can add!"],
        ];

setTimeout(function () {
    if (!isSchool && gamePlays > 10 && Math.random() > 0.9 && shortLang == "en") {
        game.enDescription = promoText[Math.floor(Math.random() * promoText.length)];
        infoBoxDesc.innerHTML = game.enDescription + loadingSizeWarning + deviceCompatabilityWarning + translationHelpRequest;
    }
}, 120000); //15000 - effectively disabled during voting time

var chosenGameDescription = game.enDescription;






//multilanguage override
//shortLang = "es";

console.log("Running multi-language section...");



var altLangAvailable = false;

const supportedLanguages = ["ar", "az", "bg", "bs", "ca", "cs", "da", "de", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu", "hy", "id", "it", "ja", "ka", "ko", "lt", "lv", "mk", "ms", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sq", "sr", "sv", "tl", "th", "tr", "uk", "ur", "uz", "vi", "zh"]; //47

function updateGameDescription() {
    supportedLanguages.forEach(checkLangDescriptions);
}

function checkLangDescriptions(testLang) {
    //if (game.hasOwnProperty(eval(testLang+ "Description") && testLang== shortLang)) {
    console.log("Running checkLangDescriptions on: " + testLang);
    if (eval("game." + testLang + "Description") !== undefined && testLang == shortLang) {
        console.log("Language: " + testLang + " description is present and is the same as shortLang.");
        altLangAvailable = true;
        chosenGameDescription = eval("game." + testLang + "Description");

        //chosenGameDescription = chosenGameDescription.replace(/13KB/g, localizedText[shortLang].tinyGame);

        infoBoxTitle.style.cursor = "cell";

        infoBoxDesc.innerHTML = chosenGameDescription + loadingSizeWarning + deviceCompatabilityWarning + translationHelpRequest;

        resetInfoBoxDescAnim();
    }
}







var doTextSizeChange = true;

function checkDescLengthAndResize() {
    if (doTextSizeChange) {
        if (infoBoxDesc.textContent.length > 250) {
            infoBoxDesc.style.fontSize = "1.7vmax";
        } else if (infoBoxDesc.textContent.length > 220) {
            infoBoxDesc.style.fontSize = "1.9vmax";
        } else {
            infoBoxDesc.style.fontSize = "2.5vmax"; //default
        }
        doTextSizeChange = false;
    }
}

function resetInfoBoxDescAnim() {

    requestAnimationFrame(() => {
        setTimeout(() => {
            infoBoxDesc.style.animationName = "textFadeIn";
        }, 100);
    });
}

updateGameDescription();

infoBoxTitle.onmouseover = function () {

    if (!showingTranslationPrompt) {

        infoBoxDesc.innerHTML = game.enDescription + " " + loadingSizeWarningEN + deviceCompatabilityWarningEN; //re-do for always english

        if (altLangAvailable) {
            infoBoxDesc.style.animationName = "none";
            infoBoxDesc.style.animationDelay = "0s";
            resetInfoBoxDescAnim();
        }
        checkDescLengthAndResize();

    }

};

infoBoxTitle.onmouseout = function () {

    if (!showingTranslationPrompt) {

        if (altLangAvailable) {
            infoBoxDesc.style.animationName = "none";
            infoBoxDesc.style.animationDelay = "0s";
        }
        updateGameDescription();
        checkDescLengthAndResize();

    }

};

infoBoxTitle.innerHTML = game.title;
infoBoxDesc.innerHTML = chosenGameDescription + loadingSizeWarning + deviceCompatabilityWarning + translationHelpRequest;
checkDescLengthAndResize();

/////////////////////////////////////////// BIT OF FUN - RANDOM TEXT EFFECT
//character replace function
function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

//all permissable characters   
var chars = "!.?&'-: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ü";

var newGameName = "";
var stringLength = game.title.length;
var testChar1 = "";
var testChar2 = "";

//generate random string of the same length as the game name
var i;
for (i = 0; i < game.title.length; i++) {
    newGameName += chars.substr((Math.floor(Math.random() * chars.length)), 1);
}

var textTimer;
if (game.title.length < 27) { //exclude effect for 2-line game titles
    setTimeout(function () {
        var textTimer = setInterval(function () {
            blastText()
        }, 100);
    }, 22000);
}

//var textTimer = setInterval(function(){ blastText() }, 100);   

function blastText() {

    for (i = 0; i < 200; i++) { //to speed up operation, do x loops each call

        //generate random character index
        randCharIndex = Math.floor(Math.random() * stringLength);

        //get random chars
        testChar1 = chars.substr((Math.floor(Math.random() * chars.length)), 1); //random character from the full list of characters
        testChar2 = game.title.substr(randCharIndex, 1); //random character from the game name

        //replace character if correct
        if (testChar1 == testChar2) {
            newGameName = setCharAt(newGameName, randCharIndex, testChar1); //if there is a match, update newGameName with the match
        }

        //write one random new character in each cycle
        if (newGameName.substr(randCharIndex, 1) != game.title.substr(randCharIndex, 1)) {
            newGameName = setCharAt(newGameName, randCharIndex, testChar1);
        }

        //when matching string is found, stop operation
        if (newGameName == game.title) {
            clearInterval(textTimer);
        }

        infoBoxTitle.innerHTML = newGameName;

    } //end for

} // end func

///////////////////////////////////////////

var requestFullscreen = function (ele) {
    if (ele.requestFullscreen) {
        ele.requestFullscreen();
    } else if (ele.webkitRequestFullscreen) {
        ele.webkitRequestFullscreen();
    } else if (ele.mozRequestFullScreen) {
        ele.mozRequestFullScreen();
    } else if (ele.msRequestFullscreen) {
        ele.msRequestFullscreen();
    } else {
        console.log('Fullscreen API is not supported.');
    }
};

var exitFullscreen = function () {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else {
        console.log('Fullscreen API is not supported.');
    }
};

//currently an unused feature - check its use with future games
var allowFullScreen = true;
//if (game.title == "Algerian Solitaire"){
//    allowFullScreen = false;
//}

//when user clicks to play game (remove loading overlay, enter fullscreen etc.)
loadingBox.addEventListener('click', function (e) {
    loadingOverlay.style.display = "none";
    backButton.style.animationPlayState = "running";
    gameEffectsButton.style.animationPlayState = "running";
    walkthroughButton.style.animationPlayState = "running";

    //ios full screen seems to cause problems, so fullscreen is disabled in iOS right now
    if (os.indexOf("iOS") == -1 && !mSpecial && !cSpecial && allowFullScreen && !devory) {
        e.preventDefault();
        requestFullscreen(document.documentElement);

        setTimeout(function () {
            fullscreenListeners();
        }, 1000);
    }

    //if needed, check orientation of game start, then listen for device orientation change. Some games "autoDetect" detect, others do not and are "noDetect" games.
    if (((game.orientation == "Portrait") || (game.orientation == "Landscape")) && (game.orientationAdviceRequired)) {
        checkOrientation();
        window.addEventListener('orientationchange', checkOrientation);
    }
    scaleGame();

    if (mSpecial) {
        window.open(atob("aHR0cHM6Ly9jbGFzc2ljLm1pbmVjcmFmdC5uZXQv"), "_blank");
    }

    if (cSpecial && shortLang == "en") {
        window.open(atob("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9sb2dvcy8yMDE3L2xvZ28xNy9sb2dvMTcuaHRtbD9obD1lbg=="), "_blank");
    }

    if (cSpecial && shortLang == "es") {
        window.open(atob("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9sb2dvcy8yMDE3L2xvZ28xNy9sb2dvMTcuaHRtbD9obD1lcw=="), "_blank");
    }

});

//if on mobile, run game orientation icon animation
if (touchDevice || debug == true) {
    if (game.orientation == "Landscape") {
        orientationIconLandscape.style.animationPlayState = "running";
    } else {
        orientationIconPortrait.style.animationPlayState = "running";
    }
}

//if on mobile AND user has wrong orientation, flash icon at x seconds
setTimeout(function () {
    if (os == "Android" || debug == true) {
        if ((screen.width < screen.height) && game.orientation == "Landscape") {
            orientationIconLandscape.style.animation = "brightFlash 3s forwards";
        }
        if ((screen.width > screen.height) && game.orientation == "Portrait") {
            orientationIconPortrait.style.animation = "brightFlash 3s forwards";
        }
    }
    if (os == "iOS") {
        if ((window.orientation == 0 || window.orientation == 180) && game.orientation == "Landscape") {
            orientationIconLandscape.style.animation = "brightFlash 3s forwards";
        }
        if ((window.orientation == 90 || window.orientation == -90) && game.orientation == "Portrait") {
            orientationIconPortrait.style.animation = "brightFlash 3s forwards";
        }
    }
}, 8000);

//if browser somehow exits fullscreen (non iOS) display button to allow user to click and go into fullscreen again, then remove button
if (os != "iOS" && allowFullScreen) {
    fullScreenButton.addEventListener('click', function (e) {
        e.preventDefault();
        requestFullscreen(document.documentElement);
        fullScreenButton.style.display = "none";
    });
}

var classicMenu = false;

var returnURL = "https://www.friv.com/";

//show new (test) games to established desktop players
if (day % 2 == 0 && os.indexOf("Desktop") > -1) { //if day is even
    returnURL = "https://www.friv.com/new.html";
}

if (isSchool || gamePlays == 23) {
    gamePlaysIncrement();
    returnURL = "https://www.friv4school.com/";
}

if (window.location.href.indexOf("?f") > -1) { //return urls ?f = friv.com/old |
    returnURL = "https://www.friv.com/old/";
    classicMenu = true;
}

if (window.location.href.indexOf("?a") > -1) {
    returnURL = "https://www.frivantiguo.net/";
    classicMenu = true;
}
if (window.location.href.indexOf("?t") > -1) {
    returnURL = "https://www.frivantigo.net/";
    classicMenu = true;
}
if (window.location.href.indexOf("?s") > -1) {
    returnURL = "https://www.frivclasico.co/";
    classicMenu = true;
}
if (window.location.href.indexOf("?c") > -1) {
    returnURL = "https://www.frivclassic.com/";
    classicMenu = true;
}
if (window.location.href.indexOf("?r") > -1) {
    returnURL = "https://www.frivclassic.org/";
    classicMenu = true;
}
if (window.location.href.indexOf("?l") > -1) {
    returnURL = "https://www.frivlegend.com/";
    classicMenu = true;
}
if (window.location.href.indexOf("?v") > -1) {
    returnURL = "https://www.frivoriginal.co/";
    classicMenu = true;
}
if (window.location.href.indexOf("?i") > -1) {
    returnURL = "https://www.frivoriginal.org/";
    classicMenu = true;
}
if (window.location.href.indexOf("?n") > -1) {
    returnURL = "https://www.oldfriv.net/";
    classicMenu = true;
}
if (window.location.href.indexOf("?o") > -1) {
    returnURL = "https://www.oldfriv.site/";
    classicMenu = true;
}
if (window.location.href.indexOf("?m") > -1) {
    returnURL = "https://www.morefriv.com/";
}
if (window.location.href.indexOf("?p") > -1) {
    returnURL = "https://www.frivplus.com/";
}

// frivantiguo.net - frivclasico.co - frivclassic.com - frivclassic.org - frivlegend.com - frivoriginal.co - frivoriginal.org - oldfriv.net - oldfriv.site - morefriv.com - frivplus.com

setTimeout(function () {

    backButton.addEventListener('click', function (e) {

        if (os != "iOS" && allowFullScreen) {
            e.preventDefault();
            exitFullscreen();
        }

        window.location.assign(returnURL);
    });

}, 999);

walkthroughButton.addEventListener('click', function (e) {
    window.open(game.walkthrough);
});

//listen for any (unexpected) screen change and make full screen button visible  
//delay added to prevent showing when user clicks back button
function fullscreenListeners() {
    //as listening for fullscreenchange seems unreliable (Android) this simpler solution works for all cases 
    setInterval(function () {
        //if (window.innerHeight == screen.height) {
        if (innerHeight / screen.height > 0.9) {
            innerHeight / screen.height
            fullScreenButton.style.display = "none";
            //console.log("browser is fullscreen (or close to)");
        }
        if (innerHeight / screen.height < 0.90 && os.indexOf("iOS") == -1) { //check it is STILL the case (timeout)
            fullScreenButton.style.display = "block";
            //console.log("browser is windowed");
        }
    }, 1000);

}

//repeatedly focus game to ensure correct start and continued play
setInterval(function () {
    gameBox.focus()
}, 500);

function checkOrientation() {
    setTimeout(function () {
        if (os == "iOS") {
            if ((window.orientation == 90 || window.orientation == -90) && game.orientation == "Landscape") {
                orientationOverlay.style.display = "none";
            }
            if ((window.orientation == 0 || window.orientation == 180) && game.orientation == "Landscape") {
                orientationOverlay.style.display = "block";
            }
            if ((window.orientation == 90 || window.orientation == -90) && game.orientation == "Portrait") {
                orientationOverlay.style.display = "block";
            }
            if ((window.orientation == 0 || window.orientation == 180) && game.orientation == "Portrait") {
                orientationOverlay.style.display = "none";
            }
        }

        if (os == "Android") {
            if ((screen.width > screen.height) && game.orientation == "Landscape") {
                orientationOverlay.style.display = "none";
            }
            if ((screen.width < screen.height) && game.orientation == "Landscape") {
                orientationOverlay.style.display = "block";
            }
            if ((screen.width > screen.height) && game.orientation == "Portrait") {
                orientationOverlay.style.display = "block";
            }
            if ((screen.width < screen.height) && game.orientation == "Portrait") {
                orientationOverlay.style.display = "none";
            }
        }
    }, 500);
}

function scaleGame() {
    gameBox.style.height = (window.innerHeight * 1) + "px";
    gameBox.style.width = (window.innerWidth * 1) + "px";
}

window.addEventListener('resize', () => {
    scaleGame();
});

gameBox.src = game.source;

//once game source specified, scale game (important for Chrome with loading flash)
scaleGame();

//overlay and flip effects etc.
effectsCounter = 0;
gameEffectsButton.addEventListener("click", function () {

    gameBox.style.transition = "1s";

    switch (effectsCounter) {
        case 0:
            gameEffectsButton.style.animation = "none";
            gameEffectsButton.style.right = "0";
            gameEffectsIndicator.style.opacity = "0.5";
            gameEffectsButton.style.opacity = "0.5";

            //aaa-disabled-for-now
            //gameOverlay.style.backgroundImage = "none";
            //analytics for those starting cycle
            //gtag('event', ('Effects Start : ' + game.title), {
            //    'event_category': 'Navigation',
            //    'event_label': 'Game Effects'
            //});

            break;
        case 1:
            gameOverlay.style.backgroundImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgTWFjaW50b3NoIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjI4RkZBQTgzNzg1NzExRTU4NTQyODc3OUM4MTZGMUREIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjI4RkZBQTg0Nzg1NzExRTU4NTQyODc3OUM4MTZGMUREIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MjhGRkFBODE3ODU3MTFFNTg1NDI4Nzc5QzgxNkYxREQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MjhGRkFBODI3ODU3MTFFNTg1NDI4Nzc5QzgxNkYxREQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz66uHInAAAAIUlEQVR42mL5//8/AyMj42YGIGBigABfEMEIkoEBgAADAKvuBwVS8BAjAAAAAElFTkSuQmCC)";
            gameOverlay.style.backgroundSize = "3px 3px";
            break;
        case 2:
            gameOverlay.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.2),rgba(0,0,0,0.0))";
            gameOverlay.style.backgroundSize = "100% 0.5%";
            break;
        case 3:
            gameOverlay.style.backgroundImage = "none";
            gameBox.style.filter = "hue-rotate(60deg)";
            break;
        case 4:
            gameBox.style.filter = "hue-rotate(120deg)";
            break;
        case 5:
            gameBox.style.filter = "hue-rotate(180deg)";
            break;
        case 6:
            gameBox.style.filter = "hue-rotate(240deg)";
            break;
        case 7:
            gameBox.style.filter = "blur(0.5vmin)";
            break;
        case 8:
            gameBox.style.filter = "blur(2vmin)";
            break;
        case 9:
            gameBox.style.filter = "none";
            gameBox.style.transform = "skewX(15deg)";
            break;
        case 10:
            gameBox.style.transform = "skewX(-15deg)";
            break;
        case 11:
            gameBox.style.transform = "scale(-1,-1)";
            break;
        case 12:
            gameBox.style.transform = "scaleX(-1)";
            break;
        case 13:
            gameBox.style.transform = "scaleY(-1)";
            break;
        case 14:
            gameBox.style.transform = "none";
            gameBox.style.filter = "grayscale(100%)";
            break;
        case 15:
            gameBox.style.filter = "sepia(100%)";
            break;
        case 16:
            gameBox.style.filter = "contrast(200%)";
            break;
        case 17:
            gameBox.style.filter = "brightness(50%)";
            break;
        case 18:
            gameBox.style.filter = "invert(100%)";
            break;
        case 19:
            gameBox.style.filter = "none";
            gameBox.style.animation = "shake2 1s infinite";
            break;
        case 20:
            gameBox.style.animation = "shake3 1s infinite";
            break;
        case 21:
            gameBox.style.animation = "rock 1s ease-in-out alternate infinite";
            break;
        case 22:
            gameBox.style.animation = "roll 10s linear infinite";

            //aaa-disabled-for-now
            //analytics for those seeing complete cycle
            //gtag('event', ('Effects Cycle'), {
            //    'event_category': 'Navigation',
            //    'event_label': 'Game Effects'
            //});
            break;
        case 23:
            gameBox.style.animation = "none";
            effectsCounter = 0;
            break;
        default:
    }
    gameEffectsIndicator.innerHTML = effectsCounter;
    effectsCounter++;
});









//TEST FOR IFRAMES
//////////////////
//console.log("Testing Framing");

var externallyFramed = false;
(function () {
    try {
        externallyFramed = top.location.host != location.host;
    } catch (err) {
        externallyFramed = true;
    }
    if (externallyFramed) {
        //top.location = location;
        console.log("Game EF."); //external framing
        console.log(document.referrer);
    } else {
        //console.log("Game NOT EF.");
    }
})();


let debugString = "Debugging: ";









//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////









//ANALYTICS
///////////


///set up analytics
var imported = document.createElement('script');
imported.src = 'https://www.googletagmanager.com/gtag/js';
document.head.appendChild(imported);

window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}

gtag('js', new Date());




var GA4ID = "G-Q1SE2SYDTW";

var sessionExpiryTime = 180000;

var gameType = "NM"; //normal

if (game.spare == 1) { //extra game
    gameType = "EX";
}

if (isSchool && game.spare == 2) { //worthy game
    sessionExpiryTime = 100000; //100 seconds
    gameType = "WT";
}

if (game.spare == 3) { //test game
    gameType = "TS";
}

if (game.spare == 7) { //test game
    gameType = "T7";
}

if (game.spare == 8) { //test game
    gameType = "T8";
}

if (game.spare == 9) { //test game
    gameType = "T9";
}

if (isSchool && game.spare == 4) { //school test game
    sessionExpiryTime = 100000; //100 seconds
    gameType = "ST";
}

if (classicMenu) {
    sessionExpiryTime = 180000;
    gameType = "CM";
}


var siteID = "F";

if (isSchool) {
    siteID = "S";
}

const cohort = 4;


debugString += "GA4ID:" + GA4ID + " | ";

gtag('config', GA4ID, {
    'send_page_view': false
});

//original ipad
if (/iPad/.test(userAgent)) {
    shortOS = "IPD";
}

//check for newer iPads etc.
if (navigator.platform === 'MacIntel' && hasTouchPoints) { //newer iPads
    shortOS = "IPN";
}

//check for newer iPhones and iPodTouch etc.
if (/iPhone|iPod/.test(userAgent)) {
    shortOS = "IPH";
}

//check for Amazon tablets
if (/silk/i.test(userAgent)) {
    shortOS = "SLK";
}

//break out android versions
if (os == "Android") {

    var androidVersionTruncated = getAndroidVersion();
    shortOS = "ANN";

    if (androidVersionTruncated == 9 || androidVersionTruncated == 10) {
        shortOS = "ANM";
    }

    if (androidVersionTruncated >= 11) {
        shortOS = "ANH";
    }
}


//SEND EVENTS
/////////////

var gameTitleTruncated = game.title.replace(/ /g, "").replace(/'/g, "").replace(/\./g, "").replace(/!/g, ""); //remove any spaces and apostrophies etc.

gameTitleTruncated = gameTitleTruncated.replace(/AndWatergirl/g, "").replace(/Scavenger/g, "Sc").replace(/Difference/g, "Diff").replace(/CarParking/g, "CarPark").replace(/ThroatSurgery/g, "Throat"); //special exception for long game names

if (gameTitleTruncated.length > 23) { //for long game names, remove some vowels - was 18
    gameTitleTruncated = gameTitleTruncated.replace(/a/g, "").replace(/e/g, "");
}

gameTitleTruncated = gameTitleTruncated.slice(0, 21); //trim whatever remains down to size - was 16

if (gamePlays > 2) {

    var submitString1 = siteID + cohort + "-" + shortOS + "-";
    var submitString2 = gameType + "-" + gameTitleTruncated;

    //add fix for iphone 'reload' games here

    gtag('event', submitString1 + "LD-" + submitString2); //on game load

    //for analytics purposes...
    if (sessionExpiryTime == 100000) {
        sessionExpiryTime = 180000;
    }

    setTimeout(function () {
        gtag('event', submitString1 + "E" + (sessionExpiryTime / 1000) + "-" + submitString2);
    }, sessionExpiryTime);

    setTimeout(function () {
        gtag('event', submitString1 + "E" + ((sessionExpiryTime * 2) / 1000) + "-" + submitString2);
    }, sessionExpiryTime * 2);

    setTimeout(function () {
        gtag('event', submitString1 + "E" + ((sessionExpiryTime * 3) / 1000) + "-" + submitString2);
    }, sessionExpiryTime * 3);

    //aaa-disabled-for-now
    //function recordRightClick() {
    //    gtag('event', ("Right Click : " + game.title), {
    //        'event_category': 'Debugging',
    //        'event_label': ('GameA : Right Click : ' + os)
    //    });
    //}

}

//record games without full translations
//console.log("game.faDescription: " + game.faDescription)

//if (game.faDescription == undefined && Math.random() > 0.0) {
//    console.log("fa-translation-needed");
//    gtag('event', "TransReqY-fa: " + gameTitleTruncated);
//}

//if (game.esDescription == undefined && Math.random() > 0.0) {
//    console.log("es-translation-needed");
//    gtag('event', "TransReqY-es: " + gameTitleTruncated);
//}

if (Object.keys(game).length < 25) {
    console.log("Language Translation Required");
    gtag('event', "TransRequired: " + gameTitleTruncated);
}

//promo
if (false) {
    promoBox.style.display = "block";
    promoBox.innerHTML = debugString;
}

//EXPERIMENTAL VIEWPORT SETTING
///////////////////////////////
if (touchDevice) {
    document.addEventListener('DOMContentLoaded', (event) => {
        //console.log('DOM fully loaded and parsed');
        setTimeout(function () {
            //console.log('Changing viewport...');
            var metaTag = document.createElement('meta');
            metaTag.name = "viewport";
            metaTag.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
            document.getElementsByTagName('head')[0].appendChild(metaTag);
        }, 7000); //best-guess-for-lh
    });
}


//DISABLE RIGHT CLICKS
//////////////////////

//disable rmb on loader page
document.addEventListener('contextmenu', event => event.preventDefault());

//disable rmb on inner game page
setTimeout(function () {

    //disable rmb on inner game
    gameBox.contentWindow.document.getElementsByTagName("body")[0].addEventListener("contextmenu", e => e.preventDefault());

    //listen for and record rmb
    //gameBox.contentWindow.document.getElementsByTagName("body")[0].addEventListener('contextmenu', function (e) {
    //    console.log("rmb");
    //    recordRightClick();
    //});

}, 2000);


//ADS CONVERSIONS
/////////////////

//setup...
window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'AW-10805618303');

//event...
if (gamePlays == 0) { //new user
    setTimeout(function () {
        console.log("conv new");
        gtag('event', 'conversion', {
            'send_to': 'AW-10805618303/vc_CCJLRooIDEP_MwqAo'
        });
    }, 90000); //90 seconds of gameplay
}

//MUSIC RATING
//////////////

if (game.musicVote == true && Math.random() > 0.7 && (shortLang == "en" || shortLang == "es" || shortLang == "pt" || shortLang == "fr" || shortLang == "pl") && os.indexOf("Desktop") > -1) {

    //shortLang = "pl";
    var thankyouString = "Thank you! 😊";
    console.log("Will run music rating. Shortlang: " + shortLang);

    setTimeout(function () {

        spare1.style.display = "block";

        var userInteraction = false;
        const voteBlock = "&nbsp;&nbsp;<span id=spare1ThumbsUp>👍</span>&nbsp;&nbsp;<span id=spare1ThumbsDown>👎</span>";

        switch (shortLang) {
            case "es":
                spare1.innerHTML = "🎵 ¡Por favor ayuda! ¿Cómo calificarías el sonido de este juego? Por ejemplo, si hay música, ¿te gusta?" + voteBlock;
                thankyouString = "¡Gracias! 😊";
                break;
            case "pt":
                spare1.innerHTML = "🎵 Por favor ajude! Como você avaliaria o som neste jogo? Por exemplo, se tem música, você gosta?" + voteBlock;
                thankyouString = "Obrigado! 😊";
                break;
            case "fr":
                spare1.innerHTML = "🎵 Aidez nous s'il vous plaît! Comment évalueriez-vous le son de ce jeu ? Par exemple, s’il y a de la musique, l’aimez-vous ?" + voteBlock;
                thankyouString = "Merci! 😊";
                break;
            case "pl":
                spare1.innerHTML = "🎵 Proszę pomóż! Jak oceniasz dźwięk w tej grze? Na przykład, jeśli jest muzyka, czy ci się podoba?" + voteBlock;
                thankyouString = "Dziękuję! 😊";
                break;
            default:
                spare1.innerHTML = "🎵 Please help! How would you rate the sound in this game? For example, if there is music, do you like it?" + voteBlock;
        }

        spare1.onmouseover = function () {
            userInteraction = true;
        };
        spare1ThumbsUp.addEventListener('click', surveyYes);
        spare1ThumbsDown.addEventListener('click', surveyNo);

        setTimeout(function () {
            if (!userInteraction) {
                spare1.style.display = "none";
            }
        }, 30000); //30000 = 30 secs

    }, 240000); //240000 = 4 mins | 10000
}

function surveyYes() {

    gtag('event', "MusicYUpVote-" + gameTitleTruncated);

    console.log("MusicYUpVote-" + gameTitleTruncated);

    removeSurvey();
}

function surveyNo() {
    gtag('event', "MusicYDownVote-" + gameTitleTruncated);

    console.log("MusicYDownVote-" + gameTitleTruncated);

    removeSurvey();
}

function removeSurvey() {
    spare1.innerHTML = thankyouString;

    setTimeout(function () {
        spare1.style.display = "none";
    }, 2000);

}

//SURVEY
////////

if (game.popIndex == undefined) {
    game.popIndex = 0;
}

console.log("game.popIndex: " + game.popIndex);

//if (Math.random() > 0.93 && game.popIndex < 20 && !game.pop && (shortLang == "es" || shortLang == "pt" || shortLang == "fr" || shortLang == "pl") && os.indexOf("Desktop") > -1) { //shortLang == "en" || 

if (false) {

    //shortLang = "pl";
    var thankyouString = "Thank you! 😊";
    console.log("Will run survey. Shortlang: " + shortLang);

    setTimeout(function () {

        spare1.style.display = "block";

        var userInteraction = false;
        console.log("userInteraction: " + userInteraction);

        const voteBlock = "&nbsp;&nbsp;<span id=spare1Yes>Yes</span>&nbsp;&nbsp;<span id=spare1No>No</span>";

        switch (shortLang) {
            case "es":
                spare1.innerHTML = "¡Por favor ayuda! ..." + voteBlock;
                spare1Yes.innerHTML = "Sí";
                spare1No.innerHTML = "No";
                thankyouString = "¡Gracias! 😊";
                break;
            case "pt":
                spare1.innerHTML = "Por favor ajude! ..." + voteBlock;
                spare1Yes.innerHTML = "Sim";
                spare1No.innerHTML = "Não";
                thankyouString = "Obrigado! 😊";
                break;
            case "fr":
                spare1.innerHTML = "S'il vous plaît, aidez-moi ! ..." + voteBlock;
                thankyouString = "Merci! 😊";
                spare1Yes.innerHTML = "Oui";
                spare1No.innerHTML = "Non";
                break;
            case "pl":
                spare1.innerHTML = "Proszę pomóż! ..." + voteBlock;
                thankyouString = "Dziękuję! 😊";
                spare1Yes.innerHTML = "Tak";
                spare1No.innerHTML = "Nie";
                break;
            default:
                spare1.innerHTML = "Please help! Do you like this game?" + voteBlock;
        }

        spare1.onmouseover = function () {
            userInteraction = true;
            console.log("userInteraction: " + userInteraction);

        };
        spare1Yes.addEventListener('click', famousSurveyYes);
        spare1No.addEventListener('click', famousSurveyNo);

        setTimeout(function () {
            if (!userInteraction) {
                spare1.style.display = "none";
            }
        }, 60000); //hide message after shown| 60000 = 1 min | 40000

    }, 90000); //show message | 90000 = 1.5 mins | 10000
} else {
    console.log("Will NOT run survey. Shortlang: " + shortLang);
}

function famousSurveyYes() {

    gtag('event', "FamousSurveyYes-" + gameTitleTruncated);

    console.log("FamousSurveyYes-" + gameTitleTruncated);

    removeSurvey();
}

function famousSurveyNo() {
    gtag('event', "FamousSurveyNo-" + gameTitleTruncated);

    console.log("FamousSurveyNo-" + gameTitleTruncated);

    removeSurvey();
}






//belt and braces removal of ios highlighting
function disableTextSelection() {
    const style = document.createElement('style');
    style.textContent = `
    * {
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      -moz-user-select: -moz-none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
    document.head.appendChild(style);
}



//RELOAD GAME TO ALLOW CORRECT RESIZING (fixes iOS bug)
///////////////////////////////////////////////////////
if (shortOS == "IPH" && game.timedReloadEnabled) { // typeof game !== 'undefined' &&
    let canReload = true;

    setTimeout(() => {
        canReload = false;
    }, 20000);

    window.addEventListener('orientationchange', function () {
        if (canReload) {
            location.reload();
        }
    });
}






//GFX INDICATOR FOR DEBUGGING
/////////////////////////////
(function () {
    let debugCircle = null;
    let colors = ['lime', 'cyan', 'red'];
    let colorIndex = 0;

    function createDebugCircle() {
        if (!debugCircle) {
            debugCircle = document.createElement('div');
            debugCircle.style.opacity = "0.8";
            debugCircle.style.position = 'fixed';
            debugCircle.style.bottom = '10px';
            debugCircle.style.right = '10px';
            debugCircle.style.width = '10px';
            debugCircle.style.height = '10px';
            debugCircle.style.borderRadius = '50%';
            debugCircle.style.zIndex = '9999';
            document.body.appendChild(debugCircle);

            setTimeout(() => {
                document.body.removeChild(debugCircle);
            }, 30000);
        }
    }

    window.showDebugCircle = function () {
        createDebugCircle();
        debugCircle.style.backgroundColor = colors[colorIndex];
        colorIndex = (colorIndex + 1) % colors.length;
    };
})();

//showDebugCircle()
