var navs = [
    //'sign-in',
    'language',
    'tasks',
    'question',
    'puzzle-piece',
    'sign-hanging',
    'flashcard',
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
        applyPendingCheckboxSettings();
        renderTopicMastery(get_selected_language());
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'question_page') {
        if(!is_language_selected())
            return {'can_be_changed_to_this_page':false, notification: 'Please select a language first!'};
        if(!quiz_started)
            return {'can_be_changed_to_this_page':false, notification: 'Please start the quiz first!'};
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'puzzle-piece_page') {
        if(!is_language_selected())
            return {'can_be_changed_to_this_page':false, notification: 'Please select a language first!'};
        if(!quiz_started)
            return {'can_be_changed_to_this_page':false, notification: 'Please start the quiz first!'};
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'sign-hanging_page') {
        if(!is_language_selected())
            return {'can_be_changed_to_this_page':false, notification: 'Please select a language first!'};
        if(!quiz_started)
            return {'can_be_changed_to_this_page':false, notification: 'Please start the quiz first!'};
        if(!hangman_ready)
            return {'can_be_changed_to_this_page':false, notification: 'No Hangman word available for this quiz. Try different topics!'};
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'flashcard_page') {
        if(!is_language_selected())
            return {'can_be_changed_to_this_page':false, notification: 'Please select a language first!'};
        if(!quiz_started)
            return {'can_be_changed_to_this_page':false, notification: 'Please start the quiz first!'};
        return {'can_be_changed_to_this_page':true, notification: ''};
    } else if (page == 'calculator_page') {
        return {'can_be_changed_to_this_page':true, notification:  ''};
    } else if (page == 'info_page') {
        return {'can_be_changed_to_this_page':true, notification:  ''};
    }
}

function selectPage(page) {
    let res = logic_correct_for_selecting_this_page(page);
    if(!res.can_be_changed_to_this_page) {
        showFeedback(res.notification, 'warning');
        return;
    }
    deselectAllNav();
    d3.select('#'+page+"_nav").attr('class','active');
    d3.select('#'+page).style("display", 'block');
}

var nav_icons = {
    'language':     'language',
    'tasks':        'tasks',
    'question':     'question',
    'puzzle-piece': 'puzzle-piece',
    'sign-hanging': 'sign-hanging',
    'flashcard':    'clone',
    'calculator':   'calculator',
    'info':         'info'
};

function init_nav_menu() {
    d3.select('#navbar').selectAll('a')
        .data(navs)
        .enter()
        .append('a')
        .attr('id',function(d){ return d+'_page_nav'; })
        .attr('class',function(d,c){ return c==0 ? 'active' : 'inactive'; })
        .attr('onclick',function(d){ return 'click_nav(\''+d+'_page\')'; })
        .html(function(d){ return '<i class="fa fa-'+(nav_icons[d]||d)+'"></i>'; });
}

