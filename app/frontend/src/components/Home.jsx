import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import axios from 'axios'
import queryString from 'query-string'
import Pagination from 'rc-pagination'
import localeInfo from 'rc-pagination/lib/locale/en_US';
import Select from 'rc-select';


import Result from './Result'

const DEFAULT_NUM = 10;

class Home extends Component {
	constructor(props){
		super(props);
		this.state = {
			value: '',
			data : [],
			hasSearched: false,
			loading : false,
			errored: false,
			current_page: 1,
			num_pages: 0,
			page_size: DEFAULT_NUM,
			token: [],
			sim_words: []
		};
		const randSuggestions = ["play the piano", "motivate myself", "sleep earlier", "be less insecure", "speak japanese"]
    this.suggestion = randSuggestions[Math.floor(Math.random()*randSuggestions.length)]

		this.changePage = this.changePage.bind(this);
		this.onShowSizeChange = this.onShowSizeChange.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.getRelatedComments = this.getRelatedComments.bind(this);
	}

	componentWillMount(){
		let query = this.props.location.search;
		if (query) {
			let parsed = queryString.parse(query)
			if (parsed.input_index) this.setState({start_index: parsed.page})
			this.getRelatedComments(parsed.query, this.state.start_index)
			this.setState({value: parsed.query})
		}
	}

	handleChange(event){
		this.setState({value: event.target.value});
	}

	handleSubmit(event){
		this.state.current_page = 1;
		let submission = this.state.value === "" ? this.suggestion : this.state.value
		let query = '?query=' + submission
		if (event) event.preventDefault();
		this.props.history.push({
		  pathname: '/',
			search: query
		})
		this.getRelatedComments(submission)
	}

	getRelatedComments(input_query) {
		if(input_query === "") {
			input_query = this.suggestion;
		}
		this.setState({loading: true})
		var arr = input_query.split(" ")
		var qParams = arr.map(key =>key).join('&');
		axios.get('/search', {
				params: {query: qParams, start_index: (this.state.current_page-1)*this.state.page_size, page_size: this.state.page_size }
			})
		.then(response => {
			this.setState({
				data: response.data[0],
				num_pages: response.data[1],
				tokens: response.data[2],
				sim_words: JSON.parse(response.data[3]),
				hasSearched: true,
				loading: false,
				errored: false,
				numShowing: this.state.page_size,
			});
		}).catch(error => {
			this.setState({ errored: true });
			console.error(error);
		});
	}

	changePage(page) {
		this.state.current_page = page;
		this.getRelatedComments(this.state.value);
	}

	onShowSizeChange(current, new_size) {
		this.setState({page_size: new_size});
	}

	render() {
		let data = this.state.data.filter(comment => { return comment.body !== "[deleted]"})
		const exampleSVDData = [{word: "instrument", score: 0.9620376924960834},
									{word: "instruments", score: 0.951993427572645},
									{word: "songs", score: 0.9484253413951718},
									{word: "musical", score: 0.9206336808288373},
									{word: "song", score: 0.913750195212453},
									{word: "keys", score: 0.9023134830328441},
									{word: "scales", score: 0.896956485769423},
									{word: "chord", score: 0.8855595339680566},
									{word: "sheet", score: 0.8837466196644155},
									{word: "keyboard", score: 0.8738338737772975}]
		const sim_words = this.state.sim_words;
		
    return (
    	<div>
    		<div>
    			<div className="header">
			      <form>
			      	<label>
			      		<p className = "title text-center">learnddit</p>
			      		<p className = "info text-center">see what's worked for redditors to learn</p>
			      		<p className = "info text-center">search for whatever you've wanted to learn and we'll tell you how <a href="https://reddit.com" target="_blank">reddit</a> users think you should learn it</p>
			      		{this.state.errored ? <div className="alert alert-danger">Failed to retrieve results!</div> : null}
			      		<span>
			      		I want to learn how to...
			      		<input className="searchBar" id="search" type="text" value={this.state.value} onChange={this.handleChange} placeholder={this.suggestion}/>
			      		</span>
			      		<button id="submit_button" onClick={this.handleSubmit}><i className="fa fa-search fa-2x" aria-hidden="true"></i></button>
			      	</label>
			      </form>
		      </div>
		      <div>
						<div className="svd">
							{ !sim_words.length ? null : 
								<div className="sim-words"> 
									Related terms: { sim_words.map((entry, i) => { return <button type="button" key={i}><b>{entry[0]}</b> ({Math.ceil(entry[1] * 100)/100 })</button>})}
								</div>
							}
						</div>
						{data.length && !this.state.loading ? <div className="tip">Hover over the IR score to see how comments are ranked!</div> : null}
			      {
			      	this.state.loading ? (<div className="loader"></div>) :
								<div>
									{(
										data.slice(this.props.history.start_index, this.state.numShowing).map((comment, i) => {
										return <Result key={i} comment={comment} style={i % 2 === 0 ? "white" : "whitesmoke"} key_words={this.state.tokens}/>})
									)}
									{ !data.length && this.state.hasSearched ? <p id="no_results">No Results Found</p> : null }
									{ !data.length ? null:
										<div id="pagination-div">
											<Pagination
															selectComponentClass={Select}
															total={this.state.num_pages}
															current={this.state.current_page}
															pageSize={this.state.page_size}
															showSizeChanger
															pageSizeOptions={['10','25','50','100']}
															onShowSizeChange={this.onShowSizeChange}
															onChange={this.changePage}
															locale={localeInfo} />
										</div>
									}
								</div>
			      }
		      </div>
	      </div>
	    	<div className="footer">
	    		<p>Zack Brody (ztb5), Eric Feng (evf23), Michelle Ip (mvi4), Monica Ong (myo3), Jill Wu (jw975)</p>
	    		<p>A project for Cornell's <a href="http://www.cs.cornell.edu/courses/cs4300/2018sp/" target="_blank"> CS 4300</a></p>
	    	</div>
      </div>
	    );
	}
}

export default Home;
