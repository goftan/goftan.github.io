function signin() {
    console.log('here');
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
            $('#hi_user').html('Hi, ' + json.username);
        } else {
            alert('Wrong username or password');
        }           
    });

}