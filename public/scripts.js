function scrollNextCard(cards, currentIndex) {
  return currentIndex === cards.length - 1 ? 0 : currentIndex + 1;
}

function scrollPreviousCard(cards, currentIndex) {
  return currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
}

$('.right-button').on('click', function(event) {
  const button = event.target.closest('.arrow-button');
  const cardIndex = parseInt(button.getAttribute('data-card-index'));
  const cards = JSON.parse(button.getAttribute('data-cards'));
  const newIndex = scrollNextCard(cards, cardIndex);
  $(`#card-${cardIndex}`).addClass("hidden");
  $(`#card-${newIndex}`).removeClass("hidden");
})

$('.left-button').on('click', function(event) {
  const button = event.target.closest('.arrow-button');
  const cardIndex = parseInt(button.getAttribute('data-card-index'));
  const cards = JSON.parse(button.getAttribute('data-cards'));
  const newIndex = scrollPreviousCard(cards, cardIndex);
  $(`#card-${cardIndex}`).addClass("hidden");
  $(`#card-${newIndex}`).removeClass("hidden");
});
