function find_suitable_neighbour_for_focus(x,y) {
    var neighbours = [
        {'x': x + 1, 'y': y},
        {'x': x, 'y': y + 1},
        {'x': x, 'y': y - 1},
        {'x': x - 1, 'y': y},
    ];
    for(n of neighbours) {
        var mynode = d3.select(id_of_cell(n.x, n.y)).node();
        if(mynode != null && mynode.value == '') {
            mynode.focus();
            return;
        }
    }
}

function get_id_from_str(id_str) {
    var tmp = id_str.split('__')[1];
    var x = parseInt(tmp.split('_')[0]);
    var y = parseInt(tmp.split('_')[1]);
    return [x,y]
}

function id_of_cell_alone(x,y) {
    return 'crossword_cells__' + x + '_' + y;
}

function id_of_cell(x,y) {
    return '#' + id_of_cell_alone(x,y);
}

function select_a_crossword_cell(el,d) {
    d3.selectAll('.crossword_cells').style('background-color', 'lightgray');
    var q = d.clue;
    var extra = d.extra;
    var x = d.startx - 1;
    var y = d.starty - 1;
    d3.select('#crossword_question').html(extra + " " + q);
    var orientation = d.orientation;
    for(var counter = 0; counter < d.answer.length;counter++) {
        if(orientation == 'across') {
            d3.select(id_of_cell(x + counter, y))
            .style('background-color','white');
        } else {
            d3.select(id_of_cell(x, y + counter))
            .style('background-color','white');
        }
    }
}

function select_a_crossword_question(el) {
    d3.selectAll('.crossword_cells').style('background-color', 'lightgray');
    var q = el.getAttribute('question');
    var extra = el.getAttribute('extra');
    d3.select('#crossword_question').html(extra + " " + q);
    var x = el.getAttribute('startx');
    var y = el.getAttribute('starty');
    
    d3.select(id_of_cell(x,y)).node().focus();
    var orientation = el.getAttribute('orientation');
    for(var counter = 0; counter < el.getAttribute('answer').length;counter++) {
        if(orientation == 'across') {
            d3.select(id_of_cell(x + counter, y))
            .style('background-color','white');
        } else {
            d3.select(id_of_cell(x, y + counter))
            .style('background-color','white');
        }
    }
}

function fill_crossword(quiz) {
    var input = [];
    for(q of quiz.slice(0,20)) {
        if(!q.choices[q.answer].includes(' ') && q.choices[q.answer].length < 10) {
            input.push({'answer': q.choices[q.answer], 'clue': q.question, 'extra': q.extra});
        }
    }
    var layout = generateLayout(input);
    var rows = layout.rows;
    var cols = layout.cols;
    var table = layout.table; // table as two-dimensional array
    var output_html = layout.table_string; // table as plain text (with HTML line breaks)
    var output_json = layout.result; // words along with orientation, position, startx, and starty
        
    d3.select('#crossword').html("");
    for(var i=0;i<rows;i++) {
        d3.select('#crossword').append('tr').selectAll("td")
        .data(table[i])
        .enter()
        .append("td")
        .style('border', function(d,c){
            if(d == '-' || d=='') return ""; 
            return '1px solid black';})
        .style('border-collapse', 'collapse')
        .style('text-align','center')
        .style('font-size','9px')
        .html(function(d,c) { 
            if(d=='-' || d=='')
                return "<span id='" + id_of_cell_alone(c, i) + "'></span>";
            else 
                return "<input class='crossword_cells' id='" + id_of_cell_alone(c, i) + "' ans='"+ d +"'>"; 
        });

        if(i == rows - 1) {
            
        } 
    }

    var xy_to_data = {};
    for(table_q of output_json) {
        var x = table_q.startx;
        var y = table_q.starty;
        var orientation = table_q.orientation;
        var answer = table_q.answer;
        var clue = table_q.clue;
        var extra = table_q.extra;
        for(var i = 0; i < answer.length; i++) {
            if(orientation == 'across') {
                xy_to_data[(x+i) + '_' + y] = {'answer': answer, 'orientation': orientation, 'startx': x, 'starty': y, 'clue': clue, 'extra': extra}; 
            } else {
                xy_to_data[x + '_' + (y+i)] = {'answer': answer, 'orientation': orientation, 'startx': x, 'starty': y, 'clue': clue, 'extra': extra};
            }
        }
    }

    d3.selectAll('input.crossword_cells')
        .on('input', function() {
            if(this.value.length > 1) {
                this.value = this.value.slice(0,1);
            }
            var tmp = this.id.split('__')[1];
            var x = parseInt(tmp.split('_')[0]);
            var y = parseInt(tmp.split('_')[1]);
            find_suitable_neighbour_for_focus(x,y);
            return this.value;
        })
        .on('click', function() {
          var id_str = d3.select(this).attr('id');
          xy = get_id_from_str(id_str);
          x = parseInt(xy[0]) + 1;
          y = parseInt(xy[1]) + 1;
          d = xy_to_data[x + '_' + y];
          startx = d.startx - 1;
          starty = d.starty - 1;
          select_a_crossword_cell(d3.select(id_of_cell(startx, starty)).node(), d);
        });


    d3.select('#across_questions').html("");
    d3.select('#down_questions').html("");
    cnt = 1;

    for(table_q of output_json) {
        d3.select(d3.select(id_of_cell(table_q.startx - 1, table_q.starty - 1))
            .node().parentNode)
            .append('span').lower()
            .attr('class', 'crossword_numerics')
            .html(cnt);

            d3.select('#' + table_q.orientation + '_questions')
            .append('span')
            .attr('startx', table_q.startx - 1)
            .attr('starty', table_q.starty - 1)
            .attr('answer', table_q.answer)
            .attr('question', table_q.clue)
            .attr('extra', table_q.extra)
            .attr('orientation', table_q.orientation)
            .style('padding', '5px')
            .attr('class', 'crossword_questions_css')
            .on('click',function() {
                d3.selectAll('.crossword_questions_css').style('color', 'black');
                d3.select(this).style('color', 'red');
                select_a_crossword_question(d3.select(this).node());
             })
            .html(cnt + ". " + " " + table_q.clue + "<br/>");
        cnt++;
    }
    select_a_crossword_question(d3.select('#across_questions').select('span').node());
}