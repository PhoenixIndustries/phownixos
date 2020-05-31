var qsRegex;
var $grid = $('#news-grid').isotope({
    itemSelector: '.grid-item',
    layoutMode: 'masonry',
    filter: function() {
        return qsRegex ? $(this).text().match( qsRegex ) : true;
      },
    getSortData: {
        date: function (elem) {
            return Date.parse($(elem).find('.date').text());
        }
    },
    sortBy : 'date',
    sortAscending : false    
});

function saveLayout() {
    if ($("#news-grid").hasClass("classic-layout")) {
        type = "classic"
    } else {
        type = "modern"
    }
    document.cookie = `layout=${type}; expires=31536000`;
  }

function layoutChanged() {
    $("#news-grid").toggleClass("classic-layout");
    saveLayout();
    setTimeout(function(){ 
        $("#news-grid").isotope(); 
     }, 450);
}

function template() {
    return `
    <article data-toggle="modal" data-target="#{{ id }}" onclick="$('.modal-body p:contains(Posts:)').hide();$('.modal-body p:contains(Participants:)').hide();"class='{{ id }} blog-post grid-item col-md-6 col-xl-4 ml-auto mr-auto {{ category }}'>
        <div class="card zoom">
            <div style="text-align:center;">
                {{ img }}
                <a>
                    <div class="mask rgba-white-slight"></div>
                </a>
                </div>
                <span>
                <h5 class="card-title">{{ title }}</h5>
                <div class="card-body" data-background-color="black"> 
                <div id="content" class="social-icons-top">    
                <div class="date">{{ pubDate }}</div> 
                {{ download }}  
                <a onclick="$(this).attr('href');" data-toggle="tooltip" data-placement="top" title="Share" href="https://twitter.com/intent/tweet?via=ManjaroLinux&hashtags=Manjaro,Linux&text={{ title }}&url={{ link }}"  target="_blank" class="btn btn-icon btn-round twitter"> 
                  <i class="fab fa-twitter"></i>
                </a>
                <a onclick="" data-toggle="tooltip" data-placement="top" title="Share" href="https://www.facebook.com/sharer/sharer.php?u={{ link }}"  target="_blank" class="btn btn-icon btn-round facebook">
                  <i class="fab fa-facebook-f"></i>
                </a>
                </span>
                </div>             
                <div class="card-text">{{ excerpt }}</div>
            </div>
    </article>
    <!-- modal -->
            <div class="modal fade" id="{{ id }}" tabindex="-1" role="dialog" aria-labelledby="news" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" aria-hidden="true">
                        &times;
                        </button>
                    </div>
                    <div class="modal-body">{{ description }}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                    </div>
            </div>
    <!-- end modal -->`
}

function cleanup(content) {
    let regex = /\||full edition:|minimal-edition:|Full ISO|Minimal ISO|direct | sig | sha1 |sha256|torrent/gi
        let excerpt = document.createElement('div'); 
        //content.description.textContent = content.description.textContent.split(' wrote:')[1]  
        let fragment = document.createRange().createContextualFragment(content.description.textContent)
        lightbox = fragment.querySelectorAll(".lightbox-wrapper");
        displayImg = fragment.querySelector("img");
        if (content.category.textContent.includes("Releases")) {
            let downloads = fragment.querySelectorAll("a[href*='https://osdn.net/']");
            if (downloads.length > 0) {
                downloads.forEach(download => { 
                    let image = download.getAttribute("href")
                    if (image.endsWith(".iso") && !image.startsWith("/")) {
                        let link = download.getAttribute("href").toString()
                        content.download = `<a class="download" href="${link}">Download</a>`
                    }
                })
            }
        } 
        if (!content.download) {
            content.download = ""
        }
        if (displayImg) {
            displayImg = displayImg.getAttribute("src")
            if (!displayImg.startsWith("/")) {
                content.img = `<img class="card-img-top" src="${displayImg}" alt="Post Image">`
            }
        } 
        if (!content.img) {
            content.img = ""
        }
        if (lightbox.length > 0) {
            lightbox.forEach(el => el.remove());
        }
        excerpt.innerHTML = fragment.textContent
        content.excerpt = excerpt
        content.excerpt.textContent = excerpt.textContent.replace(regex, "").slice(1, 200);
        content.title.textContent = content.title.textContent.replace(/\d{2,4}[\-|\/]\d{1,2}[\-]\d{1,2}|\[|\]|\(|\)|/g, "")
        content.pubDate.textContent = content.pubDate.textContent.replace(/\+0000|,/g, "").slice(0, -9).slice(4, 15)
        content.id = "id" + content.pubDate.textContent.replace(/\ /g, "") + content.title.textContent.replace(/[^a-zA-Z0-9]+/g, "")
}

function updateGrid(content) {
    // remove category introductions
    let removeItems = [
        ".id27Jan2020AbouttheReleasescategory",
        ".id27Jan2020AbouttheNewscategory",
        ".id22Apr2020AbouttheARMStableUpdatescategory",
        ".id22Apr2020AbouttheARMTestingUpdatescategory",
        ".id29Jan2020AbouttheARMReleasescategory"
    ]
    jQuery.each( removeItems, function( i, val ) {
        $(val).remove();
    });
    
    $grid.isotope( 'addItems', content.id );
    $grid.isotope('reloadItems');
    setTimeout(function(){ 
        $grid.isotope({sortBy:"date"});
    }, 2000);     
}

function getFeeds() {
    let stable = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/announcements/stable-updates.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)              
        },
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });
        
    let testing = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/announcements/testing-updates.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)              
        },
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });
       
    let unstable = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/announcements/unstable-updates.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)              
        },
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });
    
     let manjaro32 = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/announcements/manjaro32.rss",
        items: 1,
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)
        }, 
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });

    let news = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/announcements/news.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)
        }, 
        afterTemplate: function(content) {
            updateGrid(content)
        }});

    let releases = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/announcements/releases.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)
        }, 
        afterTemplate: function(content) {
            updateGrid(content)
        }});

    let armReleases = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/manjaro-arm/releases.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)
        }, 
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });
    
    let armStableUpdates = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/manjaro-arm/arm-stable-updates.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)
        }, 
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });

    let armTestingUpdates = new CorsFeedReader("#news-grid", {}, {
        feedUrl: "https://forum.manjaro.org/c/manjaro-arm/arm-testing-updates.rss",
        template: template(),
        beforeTemplate: function(content) {
            cleanup(content)
        }, 
        afterTemplate: function(content) {
            updateGrid(content)
        }
    });
    
}
 getFeeds(); 
function setUnsortLayout() {
    $grid.isotope({ filter: '.grid-item', sortBy: 'date' });
}

function sortOnclick() {
    let btn = $("#btn-sort").text()
    if (btn == "Clear") {
        $("#btn-sort").text("Filter");
        setUnsortLayout();
    } else {
        $('#sortModal').modal('show');
    }
}
function postTypeButtons() {
    var postTypeButtons = $(`
    <div class="container text-center">
    <button id="btn-layout">
          <i rel="tooltip" data-placement="top" data-toggle="tooltip" data-original-title="Set Classic Layout" class="fas fa-grip-lines"></i>
          <i rel="tooltip" data-placement="top" data-toggle="tooltip" data-original-title="Set Modern Layout" class="fas fa-grip-horizontal"></i>
        </button>
    <span><input class="quicksearch" type="text" placeholder="Search..." aria-label="Search"></span>
        <button id="btn-sort" onclick="sortOnclick();" class="btn-post-type btn-sm btn">Filter</button>
        <a id="feed" href="https://forum.manjaro.org/c/announcements.rss" target=”_blank”><i class="fas fa-rss"></i></a>
        <div id="updatesModal" class="modal fade" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Chose a Branch.</h2>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </div>
                    <div class="modal-footer">
                        <div class="btn-group" role="group" aria-label="button group">
                            <button onclick="selectPostType('.Stable');" class="btn-post-type btn btn-sm" data-dismiss="modal">Stable</button>
                            <button onclick="selectPostType('.Testing');" class="btn-post-type btn-sm btn" data-dismiss="modal">Testing</button>
                            <button onclick="selectPostType('.Unstable');" class="btn-post-type btn-sm btn" data-dismiss="modal">Unstable</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="sortModal" class="modal fade" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Choose a Category.</h2>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </div>
                    <div class="modal-footer">
                        <div class="btn-group" role="group" aria-label="button group">
                            <button data-dismiss="modal" id="btn-updates" class="btn-post-type btn btn-sm" data-toggle="modal" data-target="#updatesModal">Updates</button>
                            <button data-dismiss="modal" onclick="selectPostType('.Releases');" class="btn-post-type btn-sm btn">Releases</button>
                            <button data-dismiss="modal" onclick="selectPostType('.News');" class="btn-post-type btn-sm btn">News</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>`
    )
    return postTypeButtons 
}

function stopModal(el) {
    $(el).on('click', function (e) {
        e.stopPropagation();  
        });
};

$(".section .container").prepend(postTypeButtons());
function selectPostType(category) { 
    $("#btn-sort").text("Clear");
    $grid.isotope({ filter: category, sortBy: 'date' });
}

$(".fa-grip-lines").click(function(){ 
    layoutChanged();
    $(this).fadeOut();
    setTimeout(function(){ 
        $(".fa-grip-horizontal").fadeIn();
    }, 700);
});

$(".fa-grip-horizontal").click(function(){ 
    layoutChanged();
    $(this).fadeOut();
    setTimeout(function(){ 
        $(".fa-grip-lines").fadeIn();
    }, 700);
});

if (document.cookie.split(';').filter(function(value) {
    console.log("cookie:" +value)
    if (value.includes("classic")) {
        $("#news-grid").addClass("classic-layout");
        $(".fa-grip-lines").hide()
        $(".fa-grip-horizontal").show()
    } else {
        $("#news-grid").addClass("modern-layout");
        $(".fa-grip-horizontal").hide()
        $(".fa-grip-lines").show()
    }
}));
// use value of search field to filter
var $quicksearch = $('.quicksearch').keyup( debounce( function() {
    qsRegex = new RegExp( $quicksearch.val(), 'gi' );
    $grid.isotope();
  }, 200 ) );
  
// debounce so filtering doesn't happen every millisecond
function debounce( fn, threshold ) {
var timeout;
threshold = threshold || 100;
return function debounced() {
    clearTimeout( timeout );
    var args = arguments;
    var _this = this;
    function delayed() {
    fn.apply( _this, args );
    }
    timeout = setTimeout( delayed, threshold );
};
}
setTimeout(function(){ 
    $(".logo-overlay-loader").fadeOut();
    $grid.imagesLoaded().progress( function() {
        setTimeout(function(){ 
            $grid.isotope({sortBy:"date"});
        }, 3000);
      });
    }, 6000);

function gridTimers() {
    // the grid sometimes fails to ajust, so we use timers to make sure it gets there in diferent browser speeds.
    timers = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
    for (time in timers) {
        setTimeout(function(){ 
            $grid.isotope({sortBy:"date"});
        }, time);
    }
}
        
