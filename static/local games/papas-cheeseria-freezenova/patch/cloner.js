const ClonerLog= console.log;

window.open= function() {
    ClonerLog(arguments);
}
