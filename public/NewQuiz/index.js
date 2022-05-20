var avialble_topics = [
    'Capitals',
    // 'Countries',
    // 'Colors',
    // 'Animals',
    'Antonyms',
    'Common Words', 
    'Common Sentences'];

function fill_topic_checkboxes() {
    d3.select('#topics_checkboxes').selectAll('label').data(avialble_topics)
        .enter().append('label').text(function(d){return d;}).attr('class','container')
        .html(function(d){return '<input type="checkbox" name="topics" value="'+d+'" checked="checked" class="mycheckbox">'
                                  + d +'<span class="checkmark"></span>';});
        // .enter().append('input').attr('type', 'checkbox').attr('checked', true).attr('value','CheckBoxValue').attr('class','mycheckbox')
        // .enter().append('span').attr('class','checkmark');
    // var container = document.getElementById('container'))
    // for(var t of avialble_topics) {
    //    var topic_checkboxes_template = `
    //     <label class="container">CheckBoxValue
    //     <input type="checkbox" checked="checked" value="CheckBoxValue" class="mycheckbox">
    //     <span class="checkmark"></span>
    //     </label>`;
    //     var topic_checkboxes_replaced = topic_checkboxes_template.replaceAll('CheckBoxValue', t);
    //     d3.select('#topics_checkboxes').append('label').style('')
    // } 
}


fill_topic_checkboxes();

// d3.csv('Capitals.csv').then(function(d) {
//     console.log(d);
// });

function startQuiz() {
    let readers = [];
    d3.selectAll('.mycheckbox').property('checked', true).each(function() {
        var topic_name = d3.select(this).node().value.replaceAll(' ','') + '.json';
        console.log(topic_name);
        readers.push(d3.json(topic_name));
    });


    Promise.all(readers).then(function(files) {
        for(f of files) {
            console.log(f);
        }
        d3.select('#first_page').style("visibility", 'hidden');
    }).catch(function(err) {
        // handle error here
    })
}