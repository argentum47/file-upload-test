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


var Router = {
  routes: [],
  mode: null,
  root: '/',

  config: function config (options) {
    if(options && options.mode && !!history.pushState)
      this.mode = 'history';
    else
      this.mode = 'hash';
    this.root = options && options.root ? '/' + this.clearSlashes(options.root) + '/' : this.root;
    
    return this;
  },

  clearSlashes: function clearSlashes (path) {
    return path.toString().replace(/\/$/, '').replace(/^\//, '');
  },

  getFragment: function getFragment () {
    var fragment = '';
    if(this.mode == 'history') {
      fragment = decodeURI(location.pathname);
      fragment = this.root != '/' ? fragment.replace(this.root, '') : fragment;
    } else {
      fragment = !!location.hash ? location.hash.slice(1) : fragment;
    }
    return '/' + this.clearSlashes(fragment);
  },

  check: function check (f) {
    f = f || this.getFragment();
    for(var i = 0; i < this.routes.length; i++) {
      if(this.routes[i] && this.routes[i].re == f) {
        this.routes[i].handler.apply({}, [this.routes[i].re]);
        return this;
      }
    }
    return this;
  },

  add: function add (re, handler) {
    if(re && re.call) {
      handler = re;
      re = '';
    }
    this.routes.push({ re: re, handler: handler});
    return this;
  },

  remove: function remove (param) {
    for(var i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
      if(param.toString() == r.handler.toString() || param.toString() == r.re.toString()) {
        this.routes.splice(i, 1);
        return this;
      }
    }
    return this;
  },

  listen: function listen () {
    var that = this;
    var current = that.getFragment();
    
    var fn = function() {
      if(current !== that.getFragment()) {
        current = that.getFragment();
        that.check(current);
      }
    };

    clearInterval(this.interval);
    this.interval = setInterval(fn, 500);
    return this;
  }
};

var Template = {
  re: /{([^}]+)?}/g,
  get: function get (url, data) {
    return fetch(url, {method: 'GET'})
      .then(function(resp) {
        // var match;
        // while(match = that.re.exec(resp)) {
        //   resp.replace(match[0], data[match[1]].toString())
        // }
        var parser = new DOMParser();
        var dom = parser.parseFromString(resp, 'text/html');
        return dom.body.childNodes[0];
      })
  },
  render: function render (parent, node, append) {
    if(!append) {
      (parent || document.body).innerHTML = '';
    }
    (parent || document.body).appendChild(document.importNode(node, true));
  }
};


var Navbar = Object.create(HTMLElement.prototype);
Navbar.createdCallback =  function createdCallback () {
  var shadow = this.createShadowRoot();
  var style = ['<style>',
               ' .list-inline li {',
                    'display: inline-block;',
                    'padding: 5px 7px;',
                  '}',
                  'a {',
                    'color: #00B7FF',
                  '}',
              '</style>'].join('');

  var html = '<ul class=list-inline>';

  var dList = JSON.parse(this.dataset.list);

  dList.forEach(function (el) {
    html += '<li><a href="#' + el + '">' + el +'</a></li>';
  });

  shadow.innerHTML = style + html;
}
document.registerElement('nav-bar', { prototype: Navbar })

Router.config()
  .add('/signup', function() {
    if(localStorage.getItem('user'))
      return;
    Template.get('/templates/signup.html')
      .then(function(dom) {
        Template.render($("main"), dom)
      })
  })
  .add('/login', function() {
    if(localStorage.getItem('user'))
      return;
    Template.get('/templates/login.html')
     .then(function(dom) {
        Template.render($("main"), dom);
      })
  })
  .add('/users', function() {

  })
  .add('/upload', function() {

  })
  .add('/logout', function() {})
  .listen()


function makeLogout() {
  var li = document.createElement('li');
  var a = document.createElement('a');

  a.href="#logout";
  a.textContent = "Logout";
  li.id = "logout";
  li.appendChild(a);
  return li;
}

function toggleLoginSignup () {
  $("#navbar ul").querySelector('a[href="#login"]').parentNode.remove();
  $("#navbar ul").querySelector('a[href="#signup"]').parentNode.remove();
}


// document.addEventListener('DOMContentLoaded', function() {
//   if(localStorage.getItem('user')) {
//     $("#navbar ul").appendChild(makeLogout())
    
//   } else {
//     if($("#logout")) $("#logout").remove()
//   }

//   $('#userForm').onsubmit = function(e) {
//     e.preventDefault()
//     var fN = $("#firstName").value,
//         lN = $("#lastName").value,
//         em = $("#email").value,
//         pS = $("#password").value;

//     fetch('/users/create', {
//       method: 'POST',
//       data: { firstName: fN, lastName: lN, email: em, password: pS }
//     }).then(function(data) {
//       localStorage.setItem("user", data);
//       $("#navbar ul").appendChild(makeLogout())
//     })
//   }

//   $("#loginForm").onsubmit = function (e) {
//     e.preventDefault();
//     var em = $("#loginEmail").value,
//        pS = $("#loginPassword").value;

//     fetch('/users/login', {
//       method: 'POST',
//       data: { email: em, password: pS }
//     }).then(function (data) {
//       localStorage.setItem('user', data);
//       $("#navbar ul").appendChild(makeLogout())
//     })
//   }

//   $("a[href='#users']").onclick = function () {
//     fetch('/users', {}).then(function(data) {
//       var data = JSON.parse(data);

//       if(data.users.length) {
//         var html = '<ul class=list-unstyled>';
//         data.users.map(function(user) {
//           html += '<li><a href="#user/' + user._id +'">' + user.firstName + ' ' + user.lastName + '</a></li>';
//         })
//         html += '</ul>';

//         $("#content").innerHTML = html;
//       }
//     });
//   }

//   $("#uploadForm").onsubmit = function(e) {
//     e.preventDefault();
//     var user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) :  undefined;

//     var fD = new FormData();
//     var files = $("#files").files;
//     [].forEach.call(files, function(f) {
//       fD.append('files[]', f)
//     });

//     if(user) {
//       fetch('/users/' + user.id + '/upload', {
//         method: 'PATCH',
//         contentType: 'multipart',
//         data: fD
//       })
//     }
//   }

//   $(".container").onclick = function(e) {
//     if(e.target.closest('#logout')) {
//       localStorage.removeItem('user');
//       if($("#logout")) {
//         $('#logout').remove();
//       }
//     }
//   }
// });
