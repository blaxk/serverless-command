import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo, faTimes, faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons'
import dayjs from 'dayjs'
import { encode } from 'html-entities'
import regexParser from 'regex-parser'
import isJSON from 'is-json'
import jsonFormat from 'json-format'
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
			sortUp: true,
			findCount: 0,
			searchMin: 60,
			allExtends: false,
			extendPool: {}
		}

		this.handleVSCode = this.handleVSCode.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.handleEmptyKeyword = this.handleEmptyKeyword.bind(this)
		this.handleFind = this.handleFind.bind(this)
		this.handleTime = this.handleTime.bind(this)
		this.handleExtend = this.handleExtend.bind(this)
	}

	componentDidMount () {
		vscode.on('getLogEvents', this.handleVSCode)

		this.setState({
			allExtends: this.isLambdaLog()
		})

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
			error: '',
			extendPool: {}
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

	isLambdaLog () {
		const { location } = this.props
		const query = location.query || {}
		return /^\/aws\/lambda\//.test(query.logGroupName)
	}

	paseFormat (originList) {
		const { location } = this.props
		const query = location.query || {}

		for (const key in originList) {
			const data = originList[key]
			data.id = `${query.logStreamName}_${data.ingestionTime}_${data.timestamp}_${key}`
			
			if (isJSON(data.message)) {
				data.jsonMessage = jsonFormat(JSON.parse(data.message), {
					type: 'space',
					size: 4
				})
			}
		}

		return originList
	}

	groupBy (list) {
		const clone = JSON.parse(JSON.stringify(list))
		let result = []

		//only lambda log
		if (this.isLambdaLog()) {
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
		} else {
			if (list.length) {
				result = clone
			}
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

	handleTime (searchMin) {
		this.state.searchMin = searchMin
		this.requestData()
	}

	handleExtend (id) {
		const { extendPool } = this.state

		if (id) {
			const pool = {
				...extendPool
			}

			if (!pool[id]) {
				pool[id] = true
			} else {
				delete pool[id]
			}

			this.setState({
				allExtends: false,
				extendPool: pool
			})
		}
	}

	handleVSCode (e) {
		const { sortUp } = this.state

		if (e.error) {
			this.setState({
				loading: false,
				error: e.error
			})
		} else {
			const originList = this.paseFormat(e.result ? e.result : [])
			this.setState({
				list: this.sortBy(this.groupBy(originList), sortUp),
				originList,
				loading: false
			})
		}
	}

	handleChange (e) {
		const { originList, list } = this.state

		if (e.target.name === 'allExtends') {
			const pool = {}

			if (e.target.checked) {
				for (const data of originList) {
					pool[data.id] = true
				}
			}

			this.setState({
				allExtends: e.target.checked,
				extendPool: pool
			})
		} else if (e.target.name === 'sortUp') {
			this.setState({
				list: this.sortBy(list, e.target.checked),
				sortUp: e.target.checked,
			})
		} else {
			this.setState({
				[e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
			})
		}
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
					const match = this.matchMessage(reg, data.message)
					findCount += match.count

					data.jsonMessage

					list.push({
						...data,
						message: match.message,
						jsonMessage: data.jsonMessage ? this.matchMessage(reg, data.jsonMessage).message : undefined
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

	matchMessage (reg, originMsg) {
		let count = 0;
		let message = originMsg.replace(reg, (str) => {
			count++
			return `{{{$$$highlight-start$$$}}}${str}{{{$$$highlight-end$$$}}}`
		})

		if (count) {
			message = encode(message).replace(/{{{\$\$\$highlight-start\$\$\$}}}/g, '<span class="highlight">').replace(/{{{\$\$\$highlight-end\$\$\$}}}/g, '</span>')
		}

		return {
			count,
			message
		}
	}

	getList (list, query) {
		const { allExtends, extendPool } = this.state

		if (this.isLambdaLog()) {
			return (
				list.map((group) => (
					<ul className="group" key={`${query.logStreamName}_${group.ingestionTime}`}>
						{group.list.map((data) => (
							<li key={data.id}>
								<strong className="date" title={allExtends || extendPool[data.id] ? 'reduce' : 'extend'} onClick={() => this.handleExtend(data.id)}>
									<FontAwesomeIcon className="fa-icon" icon={allExtends || extendPool[data.id] ? faAngleDown : faAngleUp} />
									{dayjs(data.timestamp).format()}
								</strong>
								<pre>
									<code className={allExtends || extendPool[data.id] ? 'extend' : ''} dangerouslySetInnerHTML={{
										__html: (allExtends || extendPool[data.id]) && data.jsonMessage ? data.jsonMessage : data.message
									}}></code>
								</pre>
							</li>
						))}
					</ul>
				))
			)
		} else {
			if (list.length) {
				return (
					<ul className="group">
						{list.map((data) => (
							<li key={data.id}>
								<strong className="date" title={allExtends || extendPool[data.id] ? 'reduce' : 'extend'} onClick={() => this.handleExtend(data.id)}>
									<FontAwesomeIcon className="fa-icon" icon={allExtends || extendPool[data.id] ? faAngleDown : faAngleUp} />
									{dayjs(data.timestamp).format()}
								</strong>
								<pre>
									<code className={allExtends || extendPool[data.id] ? 'extend' : ''} dangerouslySetInnerHTML={{
										__html: (allExtends || extendPool[data.id]) && data.jsonMessage ? data.jsonMessage : data.message
									}}></code>
								</pre>
							</li>
						))}
					</ul>
				)
			}
		}
	}

	render () {
		const { history, location } = this.props
		const { loading, originList, list, error, keyword, regExp, findCount, sortUp, searchMin, allExtends } = this.state
		const query = location.query || {}
		const isLambda = this.isLambdaLog()

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
							<button type="button" className={searchMin === 180 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(180)}>3h</button>
							<button type="button" className={searchMin === 720 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(720)}>12h</button>
							<button type="button" className={searchMin === 1440 ? 'select' : ''} disabled={loading} onClick={() => this.handleTime(1440)}>24h</button>
						</span>
						
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
						<span className="result-count">result: {findCount}/{originList.length} (limit 1000)</span>
					</div>
					<div className="option-area">
						<span className="check-wrap">
							<input type="checkbox" name="allExtends" id="allExtends" checked={allExtends} onChange={this.handleChange} />
							<label for="allExtends">Extend list all</label>
						</span>

						{isLambda &&
							<span className="check-wrap">
								<input type="checkbox" name="sortUp" id="sortUp" checked={sortUp} onChange={this.handleChange} />
								<label for="sortUp">Sort desc list</label>
							</span>
						}
					</div>
					
					{!loading && !error &&
						this.getList(list, query)
					}

					{loading || !!error &&
						<MainIcon message={error ? 'Error' : ''} />
					}
					{!loading && !error && originList.length === 0 &&
						<MainIcon message="Not Found" />
					}
				</div>
			</Layout>
		)
	}
}


export default Events