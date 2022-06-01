var navs = [
    'sign-in',
    'language',
    'tasks',
    'question',
    'puzzle-piece',
    'calculator',
    'info'
]

function click_nav(nav_name) {
    selectPage(nav_name);
}

function deselectAllNav() {
    for(nav of navs) {
        d3.select('#'+nav+'_page_nav').attr('class','inactive');
        d3.select('#'+nav+'_page').style("display", 'none');
    }
}

function selectPage(page) {
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

