if (!JSON.parse(localStorage.getItem('localSongs'))) {
  localStorage.setItem('localSongs', '{}');
}

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

  const songs = JSON.parse(
    localStorage.getItem('localSongs')
  );

  songs[name] = videoID;

  localStorage.setItem(
    'localSongs',
    JSON.stringify(songs)
  );
  target.text('Saved!');
  changeLocalSelect($('.filterLocal').val());
};

window.changeLocalSelect = (filter) => {
  const select = $('.selectLocal');
  const songs = JSON.parse(
    localStorage.getItem('localSongs')
  );

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
      .prop('value', search);
  });
};

window.addSongs = (songs) => {
  let promise = Promise.resolve();

  $.each(songs, (i, song) => {
    promise = promise.then(() => addSong(song));
  });
};

window.addSong = (videoId) => {
  return new Promise((resolve, reject) => {
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

setInterval(() => {
  const statuses = $('.voteStatus');

  statuses.each((index, elem) => {
    if (!$(elem).find('.save-to-local-storage').length) {
      $(`<button
                class="
                    save-to-local-storage
                    btn btn-block btn-success
                "
            >Save</button>`).appendTo(elem);
    }
  });
}, 40);

$('.navbar-room-header')
  .next()
  .find('.row')
  .last()
  .find('.col-xs-4')
  .append(`
        <input type="text" class="filterLocal">
        <br/>
        <select
            class="selectLocal"
            multiple
            style="width: 100%; height: 150px;"
        />
        <br/>
        <input type="submit" value="Add" class="addLocal">
    `);
$('body')
  .on(
    'click',
    '.save-to-local-storage',
    saveToLocalStorage
  );
$('.filterLocal').on('input', () => {
  changeLocalSelect($('.filterLocal').val());
});
changeLocalSelect('');

(() => {
  const select = $('.selectLocal');
  let songsToChoose = [];

  select.on('change', () => {
    const selected = select
      .find('option')
      .toArray()
      .filter(({ selected }) => selected)
      .map(({ value }) => value);

    for (let i = songsToChoose.length - 1; i >= 0; i--) {
      if (!selected.includes(songsToChoose[i])) {
        songsToChoose.splice(i, 1);
      }
    }

    songsToChoose.push(
      ...selected
        .filter((song) => !songsToChoose.includes(song))
    );
  });
  $('.addLocal').on('click', () => {
    $('.nav-tabs')
      .find('li:contains("Search Videos") a')
      [0].click();
    addSongs(songsToChoose);
    select
      .find('option')
      .each((i, option) => option.selected = false);
    songsToChoose = [];
  });
})();
