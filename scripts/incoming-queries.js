// Wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sampleLocations = [
      '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
      '1 Infinite Loop, Cupertino, CA 95014',
      '350 Fifth Avenue, New York, NY 10118',
      '221B Baker St, New York, NY 10001',
      '500 S Buena Vista St, Burbank, CA 91521'
    ];
  
    const queryList = document.getElementById('queryList');
    if (!queryList) return; // guard if the HTML snippet isn't present
  
    // Populate two rounds for seamless scrolling
    for (let round = 0; round < 2; round++) {
      sampleLocations.forEach(loc => {
        const card = document.createElement('div');
        card.className = 'query-card';
        card.textContent = loc;
        queryList.appendChild(card);
      });
    }
  });
  