var avialble_topics = ['Capitals','Countries','Colors','Animals','Common Words', 'Common Sentences'];

function fill_topic_checkboxes() {
    var container = document.getElementById('container')
    for(var t of avialble_topics) {
       var topic_checkboxes_template = `
        <label class="container">CheckBoxValue
        <input type="checkbox" checked="checked" value="CheckBoxValue" class="mycheckbox">
        <span class="checkmark"></span>
        </label>`;
        var topic_checkboxes_replaced = topic_checkboxes_template.replaceAll('CheckBoxValue', t);
        $('#topics_checkboxes').append(topic_checkboxes_replaced)
    } 
}

function readFileAsText(fileToRead) {
    return new Promise(function(resolve, reject) {
        let fr = new FileReader();
        fr.onloadend = function() {
            console.log(fr)
            resolve(fr.result);
        }

        fr.readAsText(fileToRead);
    });
}


fill_topic_checkboxes();

let readers = [];
$('.mycheckbox:checkbox:checked').each(function() {
    var topic_name = $(this).val().replaceAll(' ','') + '.csv';
    readers.push($.get(topic_name));
    // readers.push(readFileAsText(f));
    // Promise.allSettled(readers).then((values) => {
        // console.log(values);
    // }, false);
});

// var d1 = $.get(...);
// var d2 = $.get(...);

$.when(readers).done(function(data) {
    console.log(data);
    // ...do stuff...
});