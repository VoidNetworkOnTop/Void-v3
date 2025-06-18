/*=====gid event======*/
const gid_paramValue = getParameterByName('gid', window.location.href);
if (gid_paramValue !== "" && gid_paramValue !== null) {
    console.log("gid= " + gid_paramValue)
    sendEventToGA('gid', {
        value: gid_paramValue
    });
    sendEventToGA('gid_' + gid_paramValue);
}
/*=====gid event======*/
/*=====preview home page======*/
const params_preview = new URLSearchParams(window.location.search);
if (params_preview.has('preview')) {
    const card_thumbs = document.querySelectorAll('.card__thumb');
    Array.from(card_thumbs).forEach((element, index) => {
        // Check if element has specific attribute
        if (element.hasAttribute('data-index')) {
            let index_card = element.getAttribute('data-index');
            const newElement = document.createElement('span');
            newElement.classList.add('preview_index');
            newElement.innerHTML  = `${index_card}`;
            element.appendChild(newElement);
        } else {
            console.log(`Element ${index + 1}: Does NOT have attribute`);
        }
    });
}
/*=====preview home page======*/

/*=====click event======*/
function handleClick(element) {
    let event_value = element.getAttribute('data-event_value');
    let event_name = element.getAttribute('data-event_name');
    if (event_name === null)
        return;
    let eventParams = {
        value: event_value
    };
    console.log("event: " + event_name + "__" + event_value)
    sendEventToGA(event_name, eventParams);
    sendEventToGA(event_name + "__" + event_value);
}
/*=====click event======*/
/*=====get param from href url======*/
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
/*=====get param from href url======*/
/*=====tracking browser======*/
window.addEventListener("DOMContentLoaded", (function () {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone;
    if (isPWA) {
        sendEventToGA('detect_usage_', {
            value: 'pwa'
        });
        sendEventToGA('detect_usage_pwa');
        console.log("pwa")
    } else {
        sendEventToGA('detect_usage_', {
            value: 'browser'
        });
        sendEventToGA('detect_usage_browser');
        console.log("browser")
    }
}));
/*=====tracking browser======*/