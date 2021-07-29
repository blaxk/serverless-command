import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import Index from './pages'
import Groups from './pages/groups'
import Streams from './pages/streams'
import Events from './pages/events'

import './style/vscode.css'
import './style/common.css'
import './style/page.css'


const App = () => (
	<MemoryRouter>
		<Route exact path="/" component={Index} />
		<Route exact path="/groups" component={Groups} />
		<Route exact path="/streams" component={Streams} />
		<Route exact path="/events" component={Events} />
	</MemoryRouter>
)

export default App
