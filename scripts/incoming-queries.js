document.addEventListener('DOMContentLoaded', () => {
  const sampleLocations = [
    '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
    '1 Infinite Loop, Cupertino, CA 95014',
    '350 Fifth Avenue, New York, NY 10118',
    '221B Baker St, New York, NY 10001',
    '500 S Buena Vista St, Burbank, CA 91521'
  ];

  const queryList = document.getElementById('queryList');
  if (!queryList) return;

  // build two loops for seamless scroll
  for (let round = 0; round < 2; round++) {
    sampleLocations.forEach(loc => {
      const card = document.createElement('div');
      card.className = 'query-card';
      card.textContent = loc;

      // when clicked: fill in the address field & fire calculation
      card.addEventListener('click', () => {
        const addressInput = document.getElementById('addressInput');
        const stateSelect  = document.getElementById('stateSelect');
        const zipcodeInput = document.getElementById('zipcodeInput');

        // populate full-address, disable the other inputs
        addressInput.value    = loc;
        stateSelect.value     = '';
        stateSelect.disabled  = true;
        zipcodeInput.value    = '';
        zipcodeInput.disabled = true;

        // trigger the existing calculate function
        calculateProbability();
      });

      queryList.appendChild(card);
    });
  }
});
