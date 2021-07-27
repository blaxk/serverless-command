import React, { Component } from 'react'
import Layout from '../components/layouts/Layout'
import MainIcon from '../components/MainIcon'


class Index extends Component {

	constructor (props) {
		super(props)
		this.state = {
			loading: false
		}
	}

	componentDidMount () {
		
	}

	render () {
		const { history, location } = this.props
		const { loading } = this.state

		return (
			<Layout history={history} location={location} onlyPage={true}>
				<div className="main">
					<MainIcon />
				</div>
			</Layout>
		)
	}
}


export default Index