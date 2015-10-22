const assert = require('chai').assert
const server = require('../server/server.js');
const moment = require('moment');

describe('sub-model include error', function() {
  var app;

  before(function(done) {
    app = server.start();
    server.once('started', function() {
      done();
    });
  });

  after(function(done) {
    app.close();
    done();
  });

  it('should retrieve both the writer and its social network', function(done) {
    server.models.Writer.create({
      id: 5,
      firstName: 'Loop',
      lastName: 'Back',
      email: 'support@loopback.com',
      password: 'secret',
    }).then(function(writer) {
      return server.models.Book.create({
        id: 10,
        from: '2014-12-01 00:00:00',
        to: '2015-09-01 00:00:00',
        userId: 5,
        title: 'Test Book'
      });
    }).then(function(book) {
      return server.models.SocialNetwork.create({
        id: 100,
        userId: 5,
        network: 'Facebook',
        networkHandle: '101010101',
        joined: '2015-03-01 00:00:00'
      });
    }).then(function(socialNetwork) {
      const network = 'Facebook';
      const initialDate = moment('2014-11-01T00:00:00.000Z');
      const endDate = moment('2015-10-01T00:00:00.000Z');

      console.log('finding all the books written between ' + initialDate.format() +' and ' + endDate.format());
      console.log('also retrieving the associated users with their facebook id if they\'ve joined while writing the book');

      return server.models.Book.find({
        where: {
          and: [
          {from: {gte: initialDate}},
          {to: {lte: endDate}},
          ],
        },
        include: {
          relation: 'writer',
          scope: {
            include: {
              relation: 'socialNetworks',
              where: {
                and: [
                {network: network },
                {joined: {between: [initialDate, endDate]}},
                ],
              },
            },
          },
        },
      });
    }).then(function(books) {
      try {
        console.log('found ' + books.length +' books: ' + JSON.stringify(books));
        assert.equal(1, books.length);
        assert.equal('Test Book', books[0].title);
        assert.equal('Loop', books[0].writer().firstName);
        assert.equal(1, books[0].writer().socialNetworks().length);
        assert.equal('Facebook', books[0].writer().socialNetworks()[0].network);
        assert.equal('101010101', books[0].writer().socialNetworks()[0].networkHandle);
        assert.equal(100, books[0].writer().socialNetworks()[0].id);
        done();
      } catch (exception) {
        done(exception);
      }
    }).catch(function(error) {
      done(error);
    });
  });
});

