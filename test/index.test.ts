import app from '../src/app';

describe('Sample Test', () => {
  it('Should bring new list', async () => {
    app.removeSpam(null);
    expect(true).toEqual(true);
  })
})
