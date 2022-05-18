var avialble_topics = ['Capitals','Countries','Colors','Animals','Common Words', 'Common Sentences'];

function fill_topic_checkboxes() {
    var container = document.getElementById('container')
    for(var t of avialble_topics) {
       var topic_checkboxes_template = `
        <label class="container">CheckBoxValue
        <input type="checkbox" checked="checked">
        <span class="checkmark"></span>
        </label>`;
        var topic_checkboxes_replaced = topic_checkboxes_template.replace('CheckBoxValue', t);
        $('#topics_checkboxes').append(topic_checkboxes_replaced)
    } 
}

fill_topic_checkboxes();