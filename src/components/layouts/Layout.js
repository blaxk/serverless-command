import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import vscode from '../../common/vscode'


class Layout extends Component {

	static propTypes = {
		history: PropTypes.object.isRequired,
		location: PropTypes.object.isRequired,
		onlyPage: PropTypes.bool
	}

	constructor (props) {
		super(props)
		this.state = {
			loading: false,
			error: ''
		}

		this.handleVSCode = this.handleVSCode.bind(this)
	}

	componentDidMount () {
		vscode.on('invoke', this.handleVSCode)
	}

	componentWillUnmount () {
		vscode.off('invoke', this.handleVSCode)
	}

	handleVSCode (e) {
		const { history } = this.props

		if (e.type === 'invoke') {
			if (e.logGroupName && e.logStreamName) {
				history.push({
					pathname: '/events',
					query: {
						logGroupName: e.logGroupName,
						logStreamName: e.logStreamName
					}
				})
			} else if (e.logGroupName) {
				history.push({
					pathname: '/streams',
					query: {
						logGroupName: e.logGroupName
					}
				})
			}
		}
	}

	render () {
		const { children, location, onlyPage } = this.props
		const { loading, error } = this.state
		const query = location.query || {}

		return (
			<div className="wrap">
				{!onlyPage &&
					<div className="breadcrumb">
						{query.logStreamName ?
							<Link to={{ pathname: '/streams', query: { logGroupName: query.logGroupName } }}>{query.logGroupName}</Link>
							:
							<span>{query.logGroupName}</span>
						}
						{query.logStreamName &&
							<FontAwesomeIcon className="fa-icon" icon={faChevronRight} />
						}
						{query.logStreamName &&
							<span>{query.logStreamName}</span>
						}
					</div>
				}
				
				<section className="container">
					{children}
				</section>
			</div>
		)
	}
}

export default Layout