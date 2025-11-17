exports.fetchReviewsFromSources = async (productId) => {
  return [
    { source: 'Amazon',  external_id: 'AMZ-1001', reviewer_name: 'TechGuy', rating: 5, title: 'Beast performance', content: 'High FPS, no stutters.', review_date: '2025-09-30' },
    { source: 'BestBuy', external_id: 'BBY-2002', reviewer_name: 'GamerVN', rating: 4, title: 'Solid pick',        content: '165Hz panel is great.', review_date: '2025-10-02' },
    { source: 'Newegg',  external_id: 'NEG-3003', reviewer_name: 'Phuc',    rating: 4, title: 'Worth the money',   content: 'Thermals are fine for long sessions.', review_date: '2025-10-05' }
  ];
};
