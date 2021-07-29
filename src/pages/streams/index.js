import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo } from '@fortawesome/free-solid-svg-icons'
import dayjs from 'dayjs'
import Layout from '../../components/layouts/Layout'
import MainIcon from '../../components/MainIcon'
import vscode from '../../common/vscode'


class Streams extends Component {

	constructor (props) {
		super(props)
		this.state = {
			loading: true,
			list: [],
			error: ''
		}

		this.handleVSCode = this.handleVSCode.bind(this)
	}

	componentDidMount () {
		vscode.on('getLogStreams', this.handleVSCode)
		this.requestData()
	}

	componentDidUpdate (prevProps) {
		const { location } = this.props

		if (prevProps.location.key !== location.key) {
			this.requestData()
		}
	}

	componentWillUnmount () {
		vscode.off('getLogStreams', this.handleVSCode)
	}

	requestData () {
		const { location } = this.props
		const query = location.query || {}

		this.setState({
			loading: true,
			list: [],
			error: ''
		})

		vscode.send({
			type: 'getLogStreams',
			logGroupName: query.logGroupName
		})
	}

	handleVSCode (e) {
		if (e.error) {
			this.setState({
				loading: false,
				error: e.error
			})
		} else {
			this.setState({
				list: e.result ? e.result : [],
				loading: false
			})
		}
	}

	render () {
		const { history, location } = this.props
		const { loading, list, error } = this.state
		const query = location.query || {}

		return (
			<Layout history={history} location={location}>
				<header>
					<h2>Log streams</h2>
					{/* <p>{query.logGroupName}</p> */}
					<span className="btn-group">
						<button type="button" title="refresh" disabled={loading} onClick={() => this.requestData()}>
							<FontAwesomeIcon className="fa-icon" icon={faRedo} />
						</button>
					</span>
				</header>
				<div className="content streams">
					{!loading && !error &&
						<table>
							<th>Last event time</th>
							<th>Log stream</th>
							{list.map((data) => (
								<tr key={data.logStreamName}>
									<td>
										{dayjs(data.lastEventTimestamp).format()}
									</td>
									<td>
										<Link to={{ pathname: '/events', query: { logGroupName: query.logGroupName, logStreamName: data.logStreamName } }}>
											{data.logStreamName}
										</Link>
									</td>
								</tr>
							))}
						</table>
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


export default Streams