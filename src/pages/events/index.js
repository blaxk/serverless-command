import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo, faTimes } from '@fortawesome/free-solid-svg-icons'
import dayjs from 'dayjs'
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
			findCount: 0
		}

		this.handleVSCode = this.handleVSCode.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.handleFind = this.handleFind.bind(this)
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
		const query = location.query || {}

		this.setState({
			loading: true,
			originList: [],
			list: [],
			findCount: 0,
			keyword: ''
		})

		vscode.send({
			type: 'getLogEvents',
			logGroupName: query.logGroupName,
			logStreamName: query.logStreamName
		})
	}

	handleVSCode (e) {
		if (e.error) {
			this.setState({
				loading: false,
				error: e.error
			})
		} else {
			const originList = e.result ? e.result : []
			this.setState({
				list: JSON.parse(JSON.stringify(originList)),
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

	handleFind (e) {
		const { keyword, regExp, originList } = this.state

		if (e.charCode === 13) {
			if (keyword) {
				const reg = regExp ? regexParser(keyword) : new RegExp(keyword, 'g')
				const list = []
				let findCount = 0

				for (const data of originList) {
					list.push({
						timestamp: data.timestamp,
						message: data.message.replace(reg, (str) => {
							findCount++
							return `<span class="highlight">${str}</span>`
						})
					})
				}

				this.setState({
					list,
					findCount
				})
			} else {
				this.setState({
					list: JSON.parse(JSON.stringify(originList)),
					findCount: 0
				})
			}
		}
	}

	render () {
		const { history, location } = this.props
		const { loading, list, error, keyword, regExp, findCount } = this.state

		return (
			<Layout history={history} location={location}>
				<header>
					<h2>Log events</h2>
					<span className="btn-group">
						<button type="button" title="refresh" disabled={loading} onClick={() => this.requestData()}>
							<FontAwesomeIcon className="fa-icon" icon={faRedo} />
						</button>
					</span>
				</header>
				<div className="content events">
					<div className="search-area">
						<div className="form-wrap">
							<input type="text" name="keyword" placeholder={regExp ? 'ex) /^test/g' : 'find keyword'} value={keyword} onChange={this.handleChange} onKeyPress={this.handleFind}/>
							<span className="btn-empty" title="empty input" onClick={() => this.setState({ keyword: '' })}>
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
						<ul>
							{list.map((data, key) => (
								<li key={data.timestamp + key}>
									<strong>{dayjs(data.timestamp).format()}</strong>
									<pre dangerouslySetInnerHTML={{ __html: data.message }}></pre>
								</li>
							))}
						</ul>
					}

					{loading || !!error &&
						<MainIcon />
					}
				</div>
			</Layout>
		)
	}
}


export default Events