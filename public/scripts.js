function scrollNextCard(cards, currentIndex) {
  return currentIndex === cards.length - 1 ? 0 : currentIndex + 1;
}

function scrollPreviousCard(cards, currentIndex) {
  return currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
}

function updateCardDisplay(cards, newCardIndex) {
  const mainContent = $('.main-content');
  console.log(mainContent);
  const person = cards[newCardIndex];
  console.log(person);

  if (!mainContent || !person) return;

  mainContent.innerHTML = `
    <img src='${person.image?.image_url}' width='200' height='200' class='mb-3' style='border-radius: 1rem; object-fit: cover; object-position: top'>
    <h2 class='text-white'>${person.name}</h2>
    <p class='text-white'><em>${person.agency?.name}</em></p>
    <p class='text-white mb-0'>Age: ${person.age}</p>
    <p class='text-white mb-0'>Nationality: ${person.nationality?.nationality_name}</p>
    <p class='text-white mb-0'>No. of Flights: ${person.flights_count}</p>
    <p class='text-white'>No. of spacewalks: ${person.spacewalks_count}</p>
    <p class='text-white'>${person.bio}</p>
  `;
}

$('.right-button').on('click', function(event) {
  console.log('right button')
  const button = event.target.closest('.arrow-button');
  const cardIndex = parseInt(button.getAttribute('data-card-index'));
  const cards = JSON.parse(button.getAttribute('data-cards'));

  const newIndex = scrollNextCard(cards, cardIndex);
  button.setAttribute('data-card-index', newIndex);

  updateCardDisplay(cards, newIndex)
})

$('.left-button').on('click', function(event) {
  console.log('left button');

  const button = event.target.closest('.arrow-button');
  const cardIndex = parseInt(button.getAttribute('data-card-index'));
  const cards = JSON.parse(button.getAttribute('data-cards'));

  const newIndex = scrollPreviousCard(cards, cardIndex);
  button.setAttribute('data-card-index', newIndex);

  updateCardDisplay(cards, newIndex)
});
