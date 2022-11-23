var navs = [
    //'sign-in',
    'language',
    'tasks',
    'question',
    'puzzle-piece',
    'calculator',
    'info'
]

function is_language_selected() {
    return d3.select('.languages_checkbox:checked').size() != 0;
}

function get_selected_language() {
    return d3.select('.languages_checkbox:checked').node().value;
}

function click_nav(nav_name) {
    selectPage(nav_name);
}

function deselectAllNav() {
    for(nav of navs) {
        d3.select('#'+nav+'_page_nav').attr('class','inactive');
        d3.select('#'+nav+'_page').style("display", 'none');
    }
}

function logic_correct_for_selecting_this_page(page) {
    if(page == 'language_page') {
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'tasks_page') {
        if(!is_language_selected())
            return {'can_be_changed_to_this_page':is_language_selected(), notification:  'Please select a language!'};
        
        d3.select('#known_language').text('Enjoy learning ' + get_selected_language() );
        fill_topic_checkboxes();
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'question_page') {
        if(!is_language_selected()){
            selectPage('language_page')
            return {'can_be_changed_to_this_page':is_language_selected(), notification:  'Please select a language!'};
        }
        
        if(!quiz_started) {
            selectPage('tasks_page')
            return {'can_be_changed_to_this_page':false, notification:  'Please start the quiz first!'};
        }

        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'puzzle-piece_page') {
        if(!is_language_selected()){
            selectPage('language_page')
            return {'can_be_changed_to_this_page':is_language_selected(), notification:  'Please select a language!'};
        }
        
        if(!quiz_started) {
            selectPage('tasks_page')
            return {'can_be_changed_to_this_page':false, notification:  'Please start the quiz first!'};
        }
            
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'calculator_page') {
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'info_page') {
        return {'can_be_changed_to_this_page':true, notification:  ''};
    }
}

function selectPage(page) {
    let res = logic_correct_for_selecting_this_page(page);
    if(!res.can_be_changed_to_this_page) {
        alert(res.notification);
        return;
    }
    deselectAllNav();
    d3.select('#'+page+"_nav").attr('class','active');
    d3.select('#'+page).style("display", 'block');
}

function init_nav_menu() {
    d3.select('#navbar').selectAll('a')
        .data(navs)
        .enter()
        .append('a')
        .attr('id',function(d){ return d+'_page_nav'; })
        .attr('class',function(d,c){ return c==0 ? 'active' : 'inactive'; })
        .attr('onclick',function(d){ return 'click_nav(\''+d+'_page\')'; })
        // .attr('href','javascript:void(0)')
        .html(function(d){ return '<i class="fa fa-'+d+'"></i>'; });
}

