(function(global) {
  var toParam = function(obj) {
    return Object.keys(obj).map(function(k) {
      return k + '=' + obj[k]
    }).join('&')
  };

  var dom = {
    $: document.querySelector.bind(document),

    fetch: function (url, options) {
      options.method = options.method || 'GET';
      if(!options.contentType)
        options.data = (options.data ===  Object(options.data)) ? toParam(options.data) : options.data;

      console.log(options)
      return new Promise(function(res, rej){
        var xhr = new XMLHttpRequest;
        xhr.open(options.method, url, true);
        if(!options.contentType == 'multipart')
        xhr.setRequestHeader("Content-type", options.contentType || "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
          if(xhr.status < 400 && xhr.readyState === 4)
          res(xhr.responseText, xhr)
        };
        xhr.onerror = function (err) {
          console.log(err)
          rej(err);
        };
        xhr.send(options.data)
      });
    }
  }

  return Object.assign(window, dom)
})(window)

var pages ={
  WELCOME: '#welcome',
  SIGNUP: '#signup',
  LOGIN: '#login',
  USERS: '#users',
  UPLOAD: '#upload'
}

function togglePages(pageId) {
  Object.keys(pages).forEach(function(page) {
    if(page === 'SIGNUP' || page === 'LOGIN') {
      if(localStorage.getItem('user') !== null) {
        $(pages[page]).style.display = "none";
        return;
      }
    }
    if(!pageId) {
      $('#welcome').style.display = "block";
      return;
    }
    if(pages[page] !== pageId)
      $(pages[page]).style.display = "none";
    else {
      $(pageId).style.display = "block";
      $("a[href='" + pageId +"']").click();
    }
  });
}

function makeLogout() {
  var li = document.createElement('li');
  var a = document.createElement('a');

  a.href="#logout";
  a.textContent = "Logout";
  li.id = "logout";
  li.appendChild(a);
  return li;
}

window.onhashchange = function() {
  togglePages(location.hash);
}

document.addEventListener('DOMContentLoaded', function() {
  togglePages(location.hash)

  if(localStorage.getItem('user')) {
    $("#navbar ul").appendChild(makeLogout())
  } else {
    if($("#logout")) $("#logout").remove()
  }

  $('#userForm').onsubmit = function(e) {
    e.preventDefault()
    var fN = $("#firstName").value,
        lN = $("#lastName").value,
        em = $("#email").value,
        pS = $("#password").value;

    fetch('/users/create', {
      method: 'POST',
      data: { firstName: fN, lastName: lN, email: em, password: pS }
    }).then(function(data) {
      localStorage.setItem("user", data);
      $("#navbar ul").appendChild(makeLogout())
    })
  }

  $("#loginForm").onsubmit = function (e) {
    e.preventDefault();
    var em = $("#loginEmail").value,
       pS = $("#loginPassword").value;

    fetch('/users/login', {
      method: 'POST',
      data: { email: em, password: pS }
    }).then(function (data) {
      localStorage.setItem('user', data);
      $("#navbar ul").appendChild(makeLogout())
    })
  }

  $("a[href='#users']").onclick = function () {
    fetch('/users', {}).then(function(data) {
      var data = JSON.parse(data);

      if(data.users.length) {
        var html = '<ul class=list-unstyled>';
        data.users.map(function(user) {
          html += '<li><a href="#user/' + user._id +'">' + user.firstName + ' ' + user.lastName + '</a></li>';
        })
        html += '</ul>';

        $("#content").innerHTML = html;
      }
    });
  }

  $("#uploadForm").onsubmit = function(e) {
    e.preventDefault();
    var user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) :  undefined;

    var fD = new FormData();
    var files = $("#files").files;
    [].forEach.call(files, function(f) {
      fD.append('files[]', f)
    });

    if(user) {
      fetch('/users/' + user.id + '/upload', {
        method: 'PATCH',
        contentType: 'multipart',
        data: fD
      })
    }
  }

  $(".container").onclick = function(e) {
    if(e.target.closest('#logout')) {
      localStorage.removeItem('user');
      if($("#logout")) {
        $('#logout').remove();
      }
    }
  }
});
