import React from 'react';
import { Route, withRouter, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

import './App.css';
import * as API from './BooksAPI';
import LandingPage from './Components/landingpage';
import Search from './Components/Search/search';
import errorPage from './Components/Search/404';

/**
 * @description Entry Class the MyBooks App!
 * Genderal Notes:
 * * Class Functions could be moved to another file in order to reduce Componet Size, but have been kept due to readability
 * * UI Updates after Shelfmoving operations do not happen immediately since in this implementation
 *   local State updates only happen after the completion of the API Call without an optimistic response.
 */
class BooksApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentlyReading: [],
      wantToRead: [],
      read: [],
      query: '',
      queryResult: [],
    };
  }

  /**
   * @description Makes API Call to BooksAPI with query input
   */
  handleQuery = () => {
    const { query } = this.state;
    try {
      API.search(query).then((result) => {
        Array.isArray(result)
          ? this.setState({ queryResult: result })
          : this.setState({ queryResult: [] });
      });
    } catch (err) {
      // Not gonna handle that ¯\_(ツ)_/¯
    }
  };

  /**
   * @description Sets Query String from Search Input to state.
   * Using setQuery AND handleQuery in order to preserve input State after Navigation
   * @param  {} query String
   */
  setQuery = async (query) => {
    await this.setState({ query });
    this.handleQuery();
  };

  /**
   * @description Adds book to Shelf in state
   * @param  {} id Book ID
   * @param  {} shelf New Shelf of Book
   */
  addBook = (id, shelf) => {
    API.get(id).then((book) => {
      const { [shelf]: currShelf } = this.state;
      currShelf.push(book);
      this.setState({
        [shelf]: currShelf,
      });
    });
  };

  /**
   * @description Updates State and Backend: Removes Book from Current Shelf and Adds book to new Shelf
   * @param  {} book Book ID
   * @param  {} oldShelf
   * @param  {} newShelf
   */
  handleShelfChange = (bookId, oldShelf, newShelf) => {
    const b = {};
    b.id = bookId;
    API.update(b, newShelf).then(() => {
      if (oldShelf !== 'none') {
        let { [oldShelf]: shelf } = this.state;
        shelf = shelf.filter((bookItem) => bookItem.id !== bookId);
        this.setState({
          [oldShelf]: shelf,
        });
      }
      newShelf !== 'none' && this.addBook(bookId, newShelf);
    });
  };

  /**
   * @description Fetches initial Data from Server
   */
  fetchData = () => {
    API.getAll().then((books) => {
      const currentlyReading = [];
      const wantToRead = [];
      const read = [];
      books.forEach((book) => {
        book.shelf === 'currentlyReading' && currentlyReading.push(book);
        book.shelf === 'wantToRead' && wantToRead.push(book);
        book.shelf === 'read' && read.push(book);
      });
      this.setState({
        currentlyReading,
        wantToRead,
        read,
      });
    });
  };

  componentDidMount = () => {
    this.fetchData();
  };

  render() {
    const { history } = this.props;
    const { currentlyReading, wantToRead, read, query, queryResult } = this.state;
    return (
      <div className="app">
        <Switch>
          <Route
            exact
            path="/"
            render={() => (
              <LandingPage
                currentlyReading={currentlyReading}
                wantToRead={wantToRead}
                read={read}
                history={history}
                handleShelfChange={this.handleShelfChange}
              />
            )}
          />
          <Route
            exact
            path="/search"
            render={() => (
              <Search
                goHome={() => history.push('/')}
                handleShelfChange={this.handleShelfChange}
                query={query}
                setQuery={this.setQuery}
                queryResult={queryResult}
                booksInShelve={[...currentlyReading, ...wantToRead, ...read]}
              />
            )}
          />
          <Route component={errorPage} />
        </Switch>
      </div>
    );
  }
}

BooksApp.propTypes = { history: PropTypes.any.isRequired };

export default withRouter(BooksApp);
