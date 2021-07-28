import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo, faTimes, faSortNumericUpAlt, faSortNumericDown } from '@fortawesome/free-solid-svg-icons'
import dayjs from 'dayjs'
import { encode } from 'html-entities'
import regexParser from 'regex-parser'
import Layout from '../../components/layouts/Layout'
import MainIcon from '../../components/MainIcon'
import vscode from '../../common/vscode'


class Events extends Component {

	constructor (props) {
		super(props)
		this.state = {
			loading: false,
			list: [],
			originList: [],
			error: '',
			keyword: '',
			regExp: false,
			sortUp: false,
			findCount: 0,
			searchMin: 0
		}

		this.handleVSCode = this.handleVSCode.bind(this)
		this.handleSort = this.handleSort.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.handleEmptyKeyword = this.handleEmptyKeyword.bind(this)
		this.handleFind = this.handleFind.bind(this)
		this.handleTime = this.handleTime.bind(this)
	}

	componentDidMount () {
		vscode.on('getLogEvents', this.handleVSCode)
		this.requestData()
	}

	componentDidUpdate (prevProps) {
		const { location } = this.props

		if (prevProps.location.key !== location.key) {
			this.requestData()
		}
	}

	componentWillUnmount () {
		vscode.off('getLogEvents', this.handleVSCode)
	}

	requestData () {
		const { location } = this.props
		const { searchMin } = this.state
		const query = location.query || {}

		this.setState({
			loading: true,
			originList: [],
			list: [],
			findCount: 0,
			keyword: '',
			error: ''
		})

		if (searchMin) {
			vscode.send({
				type: 'getLogEvents',
				logGroupName: query.logGroupName,
				logStreamName: query.logStreamName,
				startTime: dayjs().subtract(searchMin, 'minute').valueOf(),
				endTime: dayjs().valueOf()
			})
		} else {
			vscode.send({
				type: 'getLogEvents',
				logGroupName: query.logGroupName,
				logStreamName: query.logStreamName
			})
		}
	}

	groupBy (list) {
		const clone = JSON.parse(JSON.stringify(list))
		const result = []
		const objs = clone.reduce((carry, el) => {
			const group = el.ingestionTime

			if (carry[group] === undefined) {
				carry[group] = []
			}

			carry[group].push(el)
			return carry
		}, {})

		for (const key in objs) {
			result.push({
				ingestionTime: key,
				list: objs[key]
			})
		}

		return result
	}

	sortBy (list, sortUp) {
		const clone = JSON.parse(JSON.stringify(list))

		return clone.sort((a, b) => {
			if (a.ingestionTime > b.ingestionTime) {
				return sortUp ? -1 : 1;
			} else if (a.ingestionTime < b.ingestionTime) {
				return sortUp ? 1 : -1;
			} else {
				return 0
			}
		})
	}

	handleSort () {
		const { list, sortUp } = this.state

		this.setState({
			list: this.sortBy(list, !sortUp),
			sortUp: !sortUp,
		})
	}

	handleTime (searchMin) {
		this.state.searchMin = searchMin
		this.requestData()
	}

	handleVSCode (e) {
		const { sortUp } = this.state

		if (e.error) {
			this.setState({
				loading: false,
				error: e.error
			})
		} else {
			const originList = e.result ? e.result : []
			this.setState({
				list: this.sortBy(this.groupBy(originList), sortUp),
				originList,
				loading: false
			})
		}
	}

	handleChange (e) {
		this.setState({
			[e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
		})
	}

	handleEmptyKeyword () {
		this.setState({
			keyword: ''
		})

		if (this.keywordInput) {
			this.keywordInput.focus()
		}
	}

	handleFind (e) {
		const { keyword, regExp, originList, sortUp } = this.state

		if (e.charCode === 13) {
			if (keyword) {
				const reg = regExp ? regexParser(keyword) : new RegExp(keyword, 'g')
				const list = []
				let findCount = 0

				for (const data of originList) {
					let message = data.message.replace(reg, (str) => {
						findCount++
						return `{{{$$$highlight-start$$$}}}${str}{{{$$$highlight-end$$$}}}`
					})

					list.push({
						ingestionTime: data.ingestionTime,
						timestamp: data.timestamp,
						message: encode(message).replace(/{{{\$\$\$highlight-start\$\$\$}}}/g, '<span class="highlight">').replace(/{{{\$\$\$highlight-end\$\$\$}}}/g, '</span>')
					})
				}

				this.setState({
					list: this.sortBy(this.groupBy(list), sortUp),
					findCount
				})
			} else {
				this.setState({
					list: this.sortBy(this.groupBy(originList), sortUp),
					findCount: 0
				})
			}
		}
	}

	render () {
		const { history, location } = this.props
		const { loading, originList, list, error, keyword, regExp, findCount, sortUp, searchMin } = this.state
		const query = location.query || {}

		return (
			<Layout history={history} location={location}>
				<header>
					<h2>Log events</h2>
					<span className="btn-group">
						<span className="time-group">
							<button type="button" disabled={loading} onClick={() => this.handleTime(0)}>Clear</button>
							<button type="button" className={searchMin === 1 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(1)}>1m</button>
							<button type="button" className={searchMin === 30 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(30)}>30m</button>
							<button type="button" className={searchMin === 60 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(60)}>1h</button>
							<button type="button" className={searchMin === 720 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(720)}>12h</button>
						</span>
						<button type="button" title="sort" disabled={loading} onClick={this.handleSort}>
							<FontAwesomeIcon className="fa-icon" icon={sortUp ? faSortNumericUpAlt : faSortNumericDown} />
						</button>
						<button type="button" title="refresh" disabled={loading} onClick={() => this.requestData()}>
							<FontAwesomeIcon className="fa-icon" icon={faRedo} />
						</button>
					</span>
				</header>
				<div className="content events">
					<div className="search-area">
						<div className="form-wrap">
							<input ref={ref => { this.keywordInput = ref }} type="text" name="keyword" placeholder={regExp ? 'ex) /^test/g' : 'find keyword'} value={keyword} onChange={this.handleChange} onKeyPress={this.handleFind}/>
							<span className="btn-empty" title="empty input" onClick={this.handleEmptyKeyword}>
								<FontAwesomeIcon className="fa-icon" icon={faTimes} />
							</span>
						</div>
						<span className="check-wrap">
							<input type="checkbox" name="regExp" id="regexp" checked={regExp} onChange={this.handleChange}/>
							<label for="regexp">RegExp</label>
						</span>
						{findCount > 0 &&
							<span className="result-count">result: {findCount}</span>
						}
					</div>
					{!loading && !error &&
						list.map((group) => (
							<ul className="group" key={`${query.logStreamName}_${group.ingestionTime}`}>
								{group.list.map((data, key) => (
									<li key={`${query.logStreamName}_${group.ingestionTime}_${data.timestamp}_${key}`}>
										<strong>{dayjs(data.timestamp).format()}</strong>
										<pre><code dangerouslySetInnerHTML={{ __html: data.message }}></code></pre>
									</li>
								))}
							</ul>
						))
					}

					{loading || !!error &&
						<MainIcon message={error ? 'Error' : ''} />
					}
					{!loading && originList.length === 0 &&
						<MainIcon message="Not Found" />
					}
				</div>
			</Layout>
		)
	}
}


export default Events