function scrollNextCard(cards, currentIndex) {
  return currentIndex === cards.length - 1 ? 0 : currentIndex + 1;
};

function scrollPreviousCard(cards, currentIndex) {
  return currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
};

// need to use .each because jQuery returns an object
$('.arrow-button').each(function() {
  $(this).on('click', function(event) {
    const currentButton = $(this);
    const arrow = event.target.closest('.arrow-button');
    const cardIndex = parseInt(arrow.getAttribute('data-card-index'));
    const cards = JSON.parse(arrow.getAttribute('data-cards'));
    // arrow buttons only have 'right-button' or 'left-button'
    const newIndex = currentButton.hasClass('right-button') ? scrollNextCard(cards, cardIndex) : scrollPreviousCard(cards, cardIndex) ;
    $(`#card-${cardIndex}`).addClass("hidden");
    $(`#card-${newIndex}`).removeClass("hidden");
  });
});

// controls to toggle the ISS stats display
$('.toggle-button').each(function() {
  $(this).on('click', function(event) {
    $('.live').toggleClass('mx-3');
    $('.adjustable-main-content').toggleClass('d-none');
    $('.toggle').toggleClass('extra-left-margin');
    $('.toggle').toggleClass('left');
    $('.toggle').toggleClass('right');
  });
});
