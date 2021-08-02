import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import dayjs from 'dayjs'
import Layout from '../../components/layouts/Layout'
import MainIcon from '../../components/MainIcon'
import vscode from '../../common/vscode'


class Groups extends Component {

	constructor (props) {
		super(props)
		this.state = {
			loading: false,
			list: [],
			error: '',
			logGroupNamePrefix: '',
			nextToken: ''
		}

		this.handleVSCode = this.handleVSCode.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.handleFind = this.handleFind.bind(this)
		this.handleEmptyKeyword = this.handleEmptyKeyword.bind(this)
		this.handleMore = this.handleMore.bind(this)
	}

	componentDidMount () {
		vscode.on('getLogGroups', this.handleVSCode)
		this.requestData()
	}

	componentWillUnmount () {
		vscode.off('getLogGroups', this.handleVSCode)
	}

	requestData (nextToken) {
		const { logGroupNamePrefix, list } = this.state

		this.setState({
			loading: nextToken ? false : true,
			list: nextToken ? list : [],
			error: ''
		})

		vscode.send({
			type: 'getLogGroups',
			logGroupNamePrefix,
			nextToken
		})
	}

	getRetentionStr (day) {
		let unit = 'day'
		let val = day

		if (day > 6 && day < 30) {
			val = day / 7
			unit = 'week'
		} else if (day >= 30) {
			val = day / 30
			unit = 'month'
		}

		return `${val} ${unit}${val > 1 ? 's' : ''}`
	}

	handleVSCode (e) {
		const { list } = this.state

		if (e.error) {
			this.setState({
				loading: false,
				error: e.error
			})
		} else {
			const result = e.result ? e.result : []

			this.setState({
				list: e.isAdd ? [...list, ...result] : result,
				nextToken: e.nextToken,
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
		if (e.charCode === 13) {
			this.requestData()
		}
	}

	handleEmptyKeyword () {
		this.state.logGroupNamePrefix = ''
		this.requestData()
	}

	handleMore (e) {
		const { nextToken } = this.state
		this.requestData(nextToken)
	}

	render () {
		const { history, location } = this.props
		const { loading, list, error, logGroupNamePrefix, nextToken } = this.state

		return (
			<Layout history={history} location={location}>
				<header className="groups-header">
					<h2>Log groups</h2>
					<div className="form-wrap">
						<input ref={ref => { this.keywordInput = ref }} type="text" name="logGroupNamePrefix" placeholder="Filter log groups or try prefix search" value={logGroupNamePrefix} onChange={this.handleChange} onKeyPress={this.handleFind} />
						<span className="btn-empty" title="empty input" onClick={this.handleEmptyKeyword}>
							<FontAwesomeIcon className="fa-icon" icon={faTimes} />
						</span>
					</div>
				</header>
				<div className="content groups">
					{!loading && !error &&
						<table>
							<th>Log group</th>
							<th>Retention</th>
							{list.map((data) => (
								<tr key={data.logGroupName}>
									<td>
										<Link to={{ pathname: '/streams', query: { logGroupName: data.logGroupName } }}>
											{data.logGroupName}
										</Link>
									</td>
									<td>
										{this.getRetentionStr(data.retentionInDays)}
									</td>
								</tr>
							))}
						</table>
					}

					{!loading && list.length > 0 && nextToken &&
						<button type="button" className="btn-more" onClick={this.handleMore}>more</button>
					}

					{loading || !!error &&
						<MainIcon message={error ? 'Error' : ''} />
					}
					{!loading && !error && list.length === 0 &&
						<MainIcon message="Not Found" />
					}
				</div>
			</Layout>
		)
	}
}


export default Groups