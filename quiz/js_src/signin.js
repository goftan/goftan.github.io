function signin() {
    if(!d3.select('#username').node().value) return;
    if(!d3.select('#password').node().value.length < 5) return;
    d3.json('https://goftan.herokuapp.com/quiz', {
      method:"POST",
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*"
      }
    })
    .then(json => {
        if(json.status === 'loggedin' || json.status === 'registered') {
            console.log(json);
            localStorage.setItem('username', json.username);
            localStorage.setItem('points', json.points);
            localStorage.setItem('status', json.status);
            d3.select('#hi_user').html('Hi, ' + json.username);
        } else {
            alert('Wrong username or password');
        }           
    });
}

const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };
  
  const validate = () => {
      console.log('here');
    const result = d3.select('#result');
    const email = d3.select('#email').value();
    result.text('');
  
    if (validateEmail(email)) {
      result.text(email + ' is valid :)');
      result.css('color', 'green');
    } else {
      result.text(email + ' is not valid :(');
      result.css('color', 'red');
    }
    return false;
  }
  
d3.select('#username').on('input', function() {
    d3.select('#result').text('');
    val = d3.select('#username').node().value;
    if(validateEmail(val)) {
        d3.select('#result').text(val + ' is valid');
        d3.select('#result').style('color', 'green');
    } else {
        d3.select('#result').text(val + ' is not valid');
        d3.select('#result').style('color', 'red');
    }
});

d3.select('#password').on('input', function() {
    val = d3.select('#password').node().value;
    d3.select('#result1').text('');
    if(val.length < 5) {
        d3.select('#result1').text('Password must be at least 5 characters');
        d3.select('#result1').style('color', 'red');
    }
});