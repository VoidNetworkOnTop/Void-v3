XMLHttpRequest = new Proxy(XMLHttpRequest, {
  construct: function (target, args) {
    console.log("--fx--XMLHttpRequest--", ...args);
    const xhr = new target(...args);
    // Do whatever you want with XHR request
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 1) {
        // Before sent request to server
        // xhr.setRequestHeader("Authorization", "XXXX-XXXX-XXXX-XXXX");
      }
      if (xhr.readyState === 4) {
        // After complition of XHR request 
        if (xhr.status === 401) {
          // alert("Session expired, please reload the page!");
        }
      }
    };
    return xhr;
  },
});


window.fetchx = new Proxy(window.fetch, {
  apply: function (target, that, args) {
    console.log("--fx--fetch--", target, that, args);
    // args holds argument of fetch function
    // Do whatever you want with fetch request
    let temp = target.apply(that, args);
    temp.then((res) => {
      // After completion of request
      if (res.status === 401) {
        // alert("Session expired, please reload the page!");
      }
    });
    return temp;
  },
});


window.fetch = new Proxy(window.fetch, {
  apply: function (target, that, args) {
    console.log("--fx--fetch--", args);
    if (args[0].indexOf(".cloud.unity3d.com/")> -1) {
      // args[0]= "./patch/json/null.json?";
      // return new Promise((resolve, reject) => {
      //   reject(false);
      // });
    }    
    return target.apply(that, args);
  },
});
