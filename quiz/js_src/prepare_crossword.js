function find_suitable_neighbour_for_focus(x,y) {
    var neighbours = [
        {'x': x + 1, 'y': y},
        {'x': x, 'y': y + 1},
        {'x': x, 'y': y - 1},
        {'x': x - 1, 'y': y},
    ];
    for(n of neighbours) {
        var mynode = d3.select('#crossword_cells__' + n.x + '_' + n.y).node();
        if(mynode != null && mynode.value == '') {
            mynode.focus();
            return;
        }
    }
}

function fill_crossword(quiz) {
    var input = [];
    for(q of quiz.slice(0,20)) {
        if(!q.choices[q.answer].includes(' ')) {
            input.push({'answer': q.choices[q.answer], 'clue': q.question});
        }
    }
    var layout = generateLayout(input);
    var rows = layout.rows;
    var cols = layout.cols;
    var table = layout.table; // table as two-dimensional array
    var output_html = layout.table_string; // table as plain text (with HTML line breaks)
    var output_json = layout.result; // words along with orientation, position, startx, and starty
    console.log(output_json);
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
        // .style('background-color', function(d,c){
        //     if(d=='-')
        //         return "black"; 
        //     return 'white';
        // })
        .html(function(d,c) { 
            if(d=='-' || d=='')
                return "<span id='crossword_cells__" + c + "_" + i + "'></span>";
            else 
                return "<input class='crossword_cells' id='crossword_cells__" + c + "_" + i 
                         + "' ans='"+ d +"'>"; 
        });

        d3.selectAll('input.crossword_cells').on('input', function() {
                    if(this.value.length > 1) {
                        this.value = this.value.slice(0,1);
                    }
                    var tmp = this.id.split('__')[1];
                    var x = parseInt(tmp.split('_')[0]);
                    var y = parseInt(tmp.split('_')[1]);
                    find_suitable_neighbour_for_focus(x,y);
                    return this.value;
                });
    }


    d3.select('#across_questions').html("");
    d3.select('#down_questions').html("");
    cnt = 1
    for(table_q of output_json) {
        d3.select(d3.select('#crossword_cells__' 
            + (table_q.startx - 1)
            + '_' 
            + (table_q.starty - 1)).node().parentNode)
            .append('span').lower()
            .attr('class', 'crossword_numerics')
            .html(cnt);

        if(table_q.orientation === 'across') {
            d3.select('#across_questions')
              .append('span')
              .attr('question_coord', table_q.startx + '_' + table_q.starty)
              .attr('answer', table_q.answer)
              .on('click',function() {
                d3.selectAll('.crossword_cells').style('background-color', 'white');
                var tmp = this.getAttribute('question_coord').split('_');
                var x = tmp[0] - 1;
                var y = tmp[1] - 1;
                // console.log(x + " " + y + " " + );
                for(var counter = 0; counter < this.getAttribute('answer').length;counter++) {
                    d3.select('#crossword_cells__' 
                    + (x + counter) + '_' 
                    + (y)).style('background-color','lightblue');
                }
              })
              .html(cnt + ". " + table_q.clue + "<br/>");
        } else {
            d3.select('#down_questions')
              .html(d3.select('#down_questions').html() + '<br/>' + cnt + ". " + table_q.clue);
        }
        cnt++;
    }
}

// cnt = 0;
// arr1.forEach(function(e){
//     if(cnt == 0) 
//         d3.select('#crossword').append('tr').selectAll("td")
//         .data(arr2)
//         .enter()
//         .append("td")
//         // .style('border', '1px solid black')
//         // .style('border-collapse', 'collapse')
//         .style('width', '20px')
//         .style('height', '20px')
//         .style('text-align','center')
//         .style('font-size','9px')
//         .text(function(d,c) { if(c==0)return ""; return ""+c; });

//     td = d3.select('#crossword').append('tr').selectAll("td")
//     .data(arr2)
//     .enter()
//     .append("td")
//     .style('border', function(e,c){if(c == 0) return ""; return '1px solid black';})
//     .style('border-collapse', 'collapse')
//     .style('width', '15px')
//     .style('font-size','9px')
//     .style('height', '15px')
//     .style('text-align','center')
//     .html(function(d,c) { 
//         if(c==0) return  (cnt+1)+"";
//         return "<input class='crossword_cells' id='crossword_cells'>"; 
//     });
//     d3.selectAll('input.crossword_cells').on('input', function() {
//         if(this.value.length > 1) {
//             this.value = this.value.slice(0,1);
//         }
//         return this.value;
//     });
//     cnt++;
// });