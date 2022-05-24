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
        cols = [''].concat(table[i]);
        d3.select('#crossword').append('tr').selectAll("td")
        .data(cols)
        .enter()
        .append("td")
        .style('border', function(d,c){
            if(d == '-' || d=='') return ""; 
            return '1px solid black';})
        .style('border-collapse', 'collapse')
        .style('width', '18px')
        .style('height', '18px')
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
                    return this.value;
                });
    }

    cnt = 1
    for(table_q of output_json) {
        if(table_q.orientation === 'across') {
            d3.select('#crossword_cells__' 
            + (table_q.startx)
            + '_' 
            + (table_q.starty - 1))
            .attr('value',cnt);
        } else {
            d3.select('#crossword_cells__' 
            + (table_q.startx)
            + '_' 
            + (table_q.starty - 1 - 1))
            .attr('value',cnt)
            .html(cnt);
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