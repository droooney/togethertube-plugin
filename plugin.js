window.getLocalSongs = () => {
    return JSON.parse(localStorage.getItem('localSongs'));
};

window.updateLocalSongs = (songs) => {
    localStorage.setItem(
        'localSongs',
        JSON.stringify(songs)
    );
};

window.saveLocalSong = (videoID, name) => {
    const songs = getLocalSongs();

    songs[name] = videoID;

    updateLocalSongs(songs);
    changeLocalSelect();
};

window.saveToLocalStorage = ({ target }) => {
    target = $(target);

    const listEntry = target.closest('.videoListEntry');
    const name = listEntry
        .find('> .header h5')
        .text()
        .trim();
    const videoID = angular
        .element(listEntry[0])
        .scope()
        .playlistItem
        .media
        .id;

    saveLocalSong(videoID, name);
    target.text('Saved!');
};

window.changeLocalSelect = () => {
    const select = $('.selectLocal');
    const songs = getLocalSongs();
    const filter = $('.filterLocal').val();

    select.html('');

    $.each(songs, (song, search) => {
        if (!new RegExp(filter, 'i').test(song)) {
            return;
        }

        $(`<option>${ song }</option>`)
            .appendTo(select);
        select
            .find('option')
            .last()
            .prop('value', song);
    });
};

window.addSongs = (songs) => {
    $('.nav-tabs')
        .find('li:contains("Search Videos") a')
        [0].click();

    const localSongs = getLocalSongs();
    let promise = Promise.resolve();

    $.each(songs, (i, song) => {
        promise = promise.then(() => (
            addSong(localSongs[song])
        ));
    });
};

window.addSong = (videoId) => {
    return new Promise((resolve) => {
        $('#videoSearchInput')
            .val(`https://youtube.com/watch?v=${ videoId }`)
            [0]
            .dispatchEvent(new Event('input'));

        const list = $('.videoList');

        const interval = setInterval(() => {
            if (list.is(':visible')) {
                clearInterval(interval);

                $('.tab-content > div:eq(1) .videoListEntry')
                    .first()
                    .find('.voteStatus .btn.btn-success')
                    .first()
                    .click();

                setTimeout(resolve, 500);
            }
        }, 40);
    });
};

window.addRandomSongs = () => {
    let count = +$('.addRandomInput').val();

    if (!count) {
        return;
    }

    const localSongs = getLocalSongs();
    const keys = Object.keys(localSongs);
    const chosenSongs = [];

    while (count--) {
        const { length } = keys;
        const randIndex = Math.floor(Math.random() * length);
        const rand = keys[randIndex];

        keys.splice(randIndex, 1);
        chosenSongs.push(rand);
    }

    addSongs(chosenSongs);
};

window.getPlaylistItemsLength = () => {
    return angular
        .element($('.videoList')[0])
        .scope()
        .playlistItems
        .length;
};

if (!getLocalSongs()) {
    updateLocalSongs({});
}

setInterval(() => {
    const statuses = $('.voteStatus');

    statuses.each((index, elem) => {
        if (!$(elem).find('.saveToLocalStorage').length) {
            $(`<button
                class="
                    btn btn-block btn-success
                    saveToLocalStorage
                "
            >Save</button>`).appendTo(elem);
        }
    });

    const count = window.getPlaylistItemsLength();

    if (!count && !window.waitingToAdd) {
        window.waitingToAdd = true;

        const checkboxValue = $('.addRandomAfter0')[0].checked;

        if (checkboxValue) {
            setTimeout(window.addRandomSongs, 2000);
            setTimeout(() => {
                window.waitingToAdd = false;
            }, 4000);
        } else {
            window.waitingToAdd = false;
        }
    }
}, 40);

$('.navbar-room-header')
    .next()
    .find('.row')
    .last()
    .find('.col-xs-4')
    .append(`
        <input type="text" class="filterLocal"/>
        <br/>
        <select
            class="selectLocal"
            multiple
            style="width: 100%; height: 150px;"
        />
        <br/>
        <input type="submit" value="Add" class="addLocal"/>
        <input type="submit" value="Delete" class="deleteLocal"/>
        <input type="submit" value="Import" class="importLocal"/>
        <input type="submit" value="Export" class="exportLocal"/>
        <br/>
        <input type="text" class="addRandomInput"/>
        <input type="submit" value="Add random" class="addRandom"/>
        <br/>
        <input type="checkbox" class="addRandomAfter0"/>
        Add random songs after 0 songs left
    `);
$('#player ul.nav:eq(0)').append(`
    <li>
        <button
            class="btn btn-success navbar-btn saveLocalCurrent"
            style="margin-left: 20px;"
        >
            Save
        </button>
    </li>
`);
$('body').on(
    'click',
    '.saveToLocalStorage',
    saveToLocalStorage
);
$('.filterLocal').on('input', () => {
    changeLocalSelect();
});
$('.importLocal').on('click', () => {
    const songs = JSON.parse(
        prompt(
            `
                Paste the contents
                of what you previosly
                copied on another device
            `
                .replace(/\s+/g, ' ')
                .replace(/^ | $/g, '')
        )
    );
    const localSongs = getLocalSongs();

    Object.assign(localSongs, songs);
    updateLocalSongs(localSongs);
    changeLocalSelect();
});
$('.exportLocal').on('click', () => {
    const textarea = document.createElement('textarea');
    const range = document.createRange();
    const selection = window.getSelection();

    $(textarea).css({
        position: 'absolute',
        top: '-9999px'
    });
    textarea.textContent = (
        JSON.stringify(getLocalSongs())
    );
    document.body.appendChild(textarea);
    range.selectNodeContents(textarea);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    textarea.remove();
    alert('The songs have been copied to the clipboard');
});
$('.saveLocalCurrent').on('click', () => {
    const videoID = angular
        .element($('[data-ng-app]'))
        .scope()
        .remotePlayer
        .mediaId;

    $.get('https://www.googleapis.com/youtube/v3/videos', {
        id: videoID,
        part: 'snippet',
        key: 'AIzaSyBe_-Zv9yb3G9KBwB1kBzp9F4feyTZw_zM'
    }).then((data) => {
        const { title } = data.items[0].snippet;

        saveLocalSong(videoID, title);
    });
});
$('.addRandom').on('click', window.addRandomSongs);
changeLocalSelect();

(() => {
    const select = $('.selectLocal');
    let chosenSongs = [];

    select.on('change', () => {
        const selected = select
            .find('option')
            .toArray()
            .filter(({ selected }) => selected)
            .map(({ value }) => value);

        for (let i = chosenSongs.length - 1; i >= 0; i--) {
            if (!selected.includes(chosenSongs[i])) {
                chosenSongs.splice(i, 1);
            }
        }

        chosenSongs.push(
            ...selected
                .filter((song) => !chosenSongs.includes(song))
        );
    });
    $('.deleteLocal').on('click', () => {
        const localSongs = getLocalSongs();

        $.each(chosenSongs, (i, song) => {
            delete localSongs[song];
        });
        select
            .find('option')
            .each((i, option) => {
                option.selected = false;
            });

        updateLocalSongs(localSongs);
        changeLocalSelect();
        chosenSongs = [];
    });
    $('.addLocal').on('click', () => {
        addSongs(chosenSongs);
        select
            .find('option')
            .each((i, option) => {
                option.selected = false;
            });
        chosenSongs = [];
    });
})();
