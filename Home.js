import bootbox from 'bootbox';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import APIGlobalDep from '../APIService/APIGlobalDep';
import APILoaner from '../APIService/APILoaner';
import APIPost from '../APIService/APIPost';
import APISchedule_v2 from '../APIService/APISchedule_v2';
import APIUser from '../APIService/APIUser';
import Card from '../components/basic/cards/Card';
import CardBody from '../components/basic/cards/CardBody';
import CardHeader from '../components/basic/cards/CardHeader';
import Col from '../components/basic/Col';
import Container from '../components/basic/Container';
import ListGroup from '../components/basic/ListGroup';
import ListGroupItem from '../components/basic/ListGroupItem';
import Row from '../components/basic/Row';
import PageTitle from '../components/common/PageTitle';
import Post from '../components/common/Post';
// import { count } from "../../../lasso-new/models/user";

class Home extends React.Component {
	constructor(props) {
		super(props);

		const Dep = sessionStorage.getItem('_Dep_');

		this.state = {
			PostList: [],
			hasItemRental: false,
			count: 0,
			allActiveRentals: [],
			allOverDueItems: [],
			hasOverDueItem: false,
			allReservedItem: [],
			hasReservedItem: false,
			hasShift: false,
			allAvailableItem: [],
			currentShift: [],
			endOfShift: [],
			startOfShift: [],
			leadsMemember: [],
			selectedDepId: Dep ? JSON.parse(Dep).id : '',
			hasAvaibleItem: false,
			showOldPosts: false,
		};

		this.getAllRentalItem = this.getAllRentalItem.bind(this);
		this.getAllOverDueItems = this.getAllOverDueItems.bind(this);
		this.getAllAvailableItems = this.getAllAvailableItems.bind(this);
		this.getAllReservedItems = this.getAllReservedItems.bind(this);
		this.getCurrentShiftFromAPI = this.getCurrentShiftFromAPI.bind(this);
		this.renderOldPosts = this.renderOldPosts.bind(this);
		this.getUserFromGroup = this.getUserFromGroup.bind(this);

		let titleElement = document.getElementById('pageTitle');
		titleElement.innerHTML = 'Home | LASSO';
	}

	componentWillMount() {
		var departments = 'g';
		for (let index = 0; index < this.props.groups.length; index++) {
			if (this.props.groups[index] == 'HelpDesk') {
				departments = 'Helpdesk';
			} else if (this.props.groups[index] == 'Rettner Students') {
				departments = 'Rettner Students';
			} else if (this.props.groups[index] == 'IT Center - Students') {
				departments = 'IT Center - Students';
			}
		}

		if (this.state.selectedDepId == '') {
			APIGlobalDep.getAllGlobalDep().then((res2) => {
				if (res2) {
					const sampleId = res2[0]._id;
					this.getAllRentalItem(sampleId);
					this.getAllOverDueItems(sampleId);
					this.getAllReservedItems(sampleId);
					this.getAllAvailableItems(sampleId);
				}
			});
		}

		if (this.state.selectedDepId) {
			this.getAllRentalItem(this.state.selectedDepId);
			this.getAllOverDueItems(this.state.selectedDepId);
			this.getAllReservedItems(this.state.selectedDepId);
			this.getAllAvailableItems(this.state.selectedDepId);
		}
		this.renderOldPosts();
		this.getCurrentShiftFromAPI();

		this.getUserFromGroup(departments);

		// APIPost.getAllPosts().then((res) => {
		// 	if (!res.err) {
		// 		this.setState({ PostList: res });
		// 	}
		// });
	}

	renderOldPosts() {
		this.setState({ showOldPosts: !this.state.showOldPosts }, () => {
			var newPost = [];

			APIPost.getAllPosts().then((res) => {
				if (!res.err) {
					newPost = res;
					newPost.sort(function (a, b) {
						var valueA = 0;
						var valueB = 0;

						if (a.priority == 'Normal') {
							valueA = 4;
						} else if (a.priority == 'High') {
							valueA = 2;
						} else if (a.priority == 'Medium') {
							valueA = 3;
						} else if (a.priority == 'URGENT') {
							valueA = 1;
						}

						if (b.priority == 'Normal') {
							valueB = 4;
						} else if (b.priority == 'High') {
							valueB = 2;
						} else if (b.priority == 'Medium') {
							valueB = 3;
						} else if (b.priority == 'URGENT') {
							valueB = 1;
						}

						return valueA - valueB;
					});
					APIPost.getAllOldPosts().then((res) => {
						if (!res.err) {
							newPost.push.apply(newPost, res);

							this.setState({ PostList: newPost });
						}
					});
				}
			});
		});
	}

	getCurrentShiftFromAPI() {
		APISchedule_v2.getCurrentShifts(
			['x-auth-token', localStorage.token],
			JSON.parse(sessionStorage.getItem('_Dep_')).id
		).then((res) => {
			if (!res.success) {
				bootbox.alert(res.message);
			}

			this.setState({
				...this.state,
				currentShift: res.currentEvents,
				hasShift: Object.keys(res.currentEvents).length !== 0,
			});
		});
	}

	getAllRentalItem(department) {
		APILoaner.getAllActiveRentalsForHome(department).then((res) => {
			var hasItem = false;
			if (res.length != 0) {
				hasItem = true;
			}
			var activeRentals = [];

			for (let index = 0; index < res.length; index++) {
				if (index < 3) {
					const dueTime = Date.parse(res[index]['endDate']);
					const now = Date.now();
					const diff = now - dueTime;
					const differ = Math.floor(diff / 1000 / 60 / (60 * 24));
					if (differ < 1) {
						var map = {
							data: res[index],
							dueIn: 'Due in ' + Math.abs(differ) + ' day(s)',
						};
						activeRentals.push(map);
					} else if (differ == 0 || differ < 1) {
						var map = { data: res[index], dueIn: 'Due  in few hours' };
						activeRentals.push(map);
					} else {
						var map = { data: res[index], dueIn: 'Past Due Time' };
						activeRentals.push(map);
					}
				}
			}

			this.setState({
				allActiveRentals: activeRentals,
				hasItemRental: hasItem,
			});
		});
	}
	getAllReservedItems(department) {
		APILoaner.getItemsReservedToday(department).then((res) => {
			var hasReserved = false;
			if (res.length != 0) {
				hasReserved = true;
			}
			var reservedItem = [];

			for (let index = 0; index < res.length; index++) {
				var map = {
					user: res[index]['user'],
					item: res[index]['item'],
					department: res[index]['department'],
				};

				reservedItem.push(map);
			}

			this.setState({
				allReservedItem: reservedItem,
				hasReservedItem: hasReserved,
			});
		});
	}
	getAllOverDueItems(department) {
		APILoaner.getOverDueItems(department).then((res) => {
			var hasOver = false;

			if (res.length != 0) {
				hasOver = true;
			}
			var overDue = [];

			for (let index = 0; index < res.length; index++) {
				const dueTime = Date.parse(res[index]['startDate']);
				const now = Date.now();
				const diff = Math.abs(now - dueTime);
				var differ = Math.floor(diff / 1000 / 60 / (60 * 24));
				if (differ == 0) {
					differ = 'due to';
				}
				var map = { data: res[index], days: differ };

				overDue.push(map);
			}

			this.setState({
				allOverDueItems: overDue,
				hasOverDueItem: hasOver,
			});
		});
	}

	getAllAvailableItems(department) {
		APILoaner.getItemsAvailableToday(department).then((res) => {
			var hasAllItemAva = false;
			if (res.length != 0) {
				hasAllItemAva = true;
			}
			var allAvailable = [];

			for (let index = 0; index < res.length; index++) {
				if (index < 5) {
					allAvailable.push(res[index]);
				}
			}

			this.setState({
				allAvailableItem: allAvailable,
				hasAvaibleItem: hasAllItemAva,
			});
		});
	}

	getUserFromGroup(department) {
		var leadGroup = ['ITCLeads', 'RettnerLeads', 'LassoAdmin', 'ITCManagers'];
		var group = leadGroup[0];
		if (department == 'Rettner Students') {
			group = leadGroup[1];
		} else if (department == 'IT Center - Students') {
			group = leadGroup[0];
		}

		APIUser.getAllUsersFromGroup(group).then((res) => {
			// var results = []
			// for (let res = 0; res < res.length; res++) {
			// if(res[index].isActive ){
			// 	results.push(res[index])
			// }
			// }

			//console.log(results)
			if (res.err || res.length == 0) {
			} else {
				const date = new Date();
				let day = date.getDay();
				this.setState({
					leadsMemember: [res[day % res.length]],
				});
			}
		});
	}

	render() {
		return (
			<Container fluid className='main-content-container px-4'>
				{/* Page Header */}
				<Row noGutters className='page-header py-4'>
					<PageTitle title='Latest Updates' className='text-sm-left mb-3' />
				</Row>
				{/* Post Updates */}
				<Row>
					<Col lg='9' className='mb-4'>
						<Card small className='mb-'>
							<div class='bg-white px-4 py-5 border-b border-gray-200 sm:px-6'>
								<div class='-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap'>
									<div class='ml-4 mt-2'>
										<h3 class='text-lg leading-6 font-medium text-gray-900'>
											Recent Posts
										</h3>
									</div>
									<div class='ml-4 mt-2 flex-shrink-0'>
										<Link to='/add-new-post'>
											<button
												type='button'
												class='relative inline-flex items-center px-4 py-2  border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-800' //added btn-accent class
												// style = {{backgroundColor: '#007bff'}}
											>
												Create new Post
											</button>
										</Link>
									</div>
								</div>
							</div>

							<ListGroup flush>
								<ListGroupItem className='p-3'>
									<CardBody>
										<Post
											className='mt-0'
											PostList={this.state.PostList}
										></Post>
									</CardBody>
								</ListGroupItem>
							</ListGroup>
						</Card>
					</Col>

					<Col lg='3' clasName='mb-4'>
						<Card small className='mb-4'>
							<CardHeader className='border-bottom'>
								<h6 className='m-0 text-gray-900'> {/*changed from teal*/}
									Current Shift
								</h6>
							</CardHeader>
							<ListGroup flush>
								<ListGroupItem className='p-2 '>
									{
										<ListGroupItem>
											<div>
												<div class='flow-root'>
													<ul
														role='list'
														class='-my-5 divide-y divide-gray-200'
													>
														<li class='py-2 '>
															{this.state.hasShift ? (
																Object.keys(this.state.currentShift).map(
																	(key) => {
																		return (
																			<div>
																				<div className='text-lg font-medium text-gray-900'>
																					{key}
																				</div>
																				{this.state.currentShift[key].map(
																					(value) => {
																						return (
																							<div class='flex items-center'>
																								<div>
																									{value.title === 'taken' ? (
																										<Link
																											to={
																												'/user-profile/' +
																												value.tempOwner.username
																											}
																											class='block hover:bg-gray-100'
																										>
																											<span class='inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-500'>
																												<span class='text-base font-medium leading-none text-white'>
																													{value.tempOwner.firstName.charAt(
																														0
																													) +
																														value.tempOwner.lastName.charAt(
																															0
																														)}
																												</span>
																											</span>
																										</Link>
																									) : (
																										<div className='block hover:bg-gray-100'>
																											<span class='inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-500'>
																												<span class='text-base font-medium leading-none text-white'>
																													O
																												</span>
																											</span>
																										</div>
																									)}
																								</div>
																								<div class='ml-3'>
																									<div class='flex-auto'>
																										<p class='   text-gray-900'>
																											{value.title ===
																											'taken' ? (
																												<Link
																													to={
																														'/user-profile/' +
																														value.tempOwner
																															.username
																													}
																													class='block hover:bg-gray-100'
																												>
																													{' '}
																													<p class='text-sm font-medium text-gray-900 truncate'>
																														{value.tempOwner
																															.firstName +
																															' ' +
																															value.tempOwner
																																.lastName}{' '}
																													</p>
																												</Link>
																											) : (
																												<p class='text-sm font-medium text-gray-900 truncate'>
																													Open
																												</p>
																											)}
																										</p>
																										<p class='mt-0.5'>
																											<time dateTime='2022-01-21T13:00'>
																												{' '}
																												{value.start}
																											</time>{' '}
																											-{' '}
																											<time dateTime='2022-01-21T14:30'>
																												{' '}
																												{value.end}
																											</time>
																										</p>
																									</div>
																								</div>
																							</div>
																						);
																					}
																				)}
																			</div>
																		);
																	}
																)
															) : (
																<li class='py-1 flex'>
																	<div class=' py-1 '>
																		<p class='text-sm font-medium  '
																		   style = {{color: '#6a6c6f'}}>
																			No current Shift!
																		</p>
																	</div>
																</li>
															)}
														</li>
													</ul>
												</div>
											</div>
										</ListGroupItem>
									}
								</ListGroupItem>
							</ListGroup>
						</Card>

						<Card small className='mb-4'>
							<CardHeader className='border-bottom'>
								<h6 className='m-0 text-gray-900'>
									Active Rentals
								</h6>
							</CardHeader>
							<ListGroup flush>
								<ListGroupItem className='p-2 px-2 pt-2'>
									{
										<ListGroupItem>
											<div>
												<div class='flow-root mt-6'>
													<ul
														role='list'
														class='-my-5 divide-y divide-gray-200'
													>
														{this.state.allActiveRentals.length != 0 ? (
															this.state.allActiveRentals.map((item) => (
																<li class='py-3'>
																	<div class='flex items-center space-x-4'>
																		<div class='flex-1 min-w-0'>
																			<p class='text-sm font-medium text-gray-900 truncate'>
																				{item.data.item.name}{' '}
																			</p>
																			<p class='text-sm text-gray-500 truncate'>
																				@{item.data.user.username}
																			</p>
																			{item.dueIn == 'Past Due Time' ? (
																				<p class='text-sm text-red-700 truncate'>
																					{item.dueIn}
																				</p>
																			) : (
																				<p class='text-sm text-blue-800  truncate'>
																					{item.dueIn}
																				</p>
																			)}
																		</div>
																		<div>
																			<a
																				href={`/loanercal/2/${item.data.department.id}`}
																				class='inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50'
																			>
																				{' '}
																				View{' '}
																			</a>
																		</div>
																	</div>
																</li>
															))
														) : (
															<li class='py-0 flex'>
																<div class=' px-0 '>
																	<p class='text-sm font-medium  '>
																		No Active Rentals!
																	</p>
																</div>
															</li>
														)}
													</ul>
												</div>

												{this.state.allActiveRentals.length != 0 ? (
													<div class='mt-6'>
														<a
															href={`/loanercal/2/${this.state.allActiveRentals[0].data.department.id}`}
															class='w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
														>
															{' '}
															View all{' '}
														</a>
													</div>
												) : (
													<div></div>
												)}
											</div>
										</ListGroupItem>
									}
								</ListGroupItem>
							</ListGroup>
						</Card>

						<Card small className='mb-4'>
							<CardHeader className='border-bottom'>
								<h6 className='m-0 text-gray-900'>
									Reserved Items
								</h6>
							</CardHeader>
							<ListGroup flush>
								<ListGroupItem className='p-2 px-2 pt-2'>
									{
										<ListGroupItem>
											<div>
												<div class='flow-root mt-6'>
													<ul
														role='list'
														class='-my-5 divide-y divide-gray-200'
													>
														{this.state.allReservedItem.length != 0 ? (
															this.state.allReservedItem.map((item) => (
																<li class='py-3'>
																	<div class='flex items-center space-x-4'>
																		<div class='flex-1 min-w-0'>
																			<p class='text-sm font-medium text-gray-900 truncate'>
																				{item.item.name}{' '}
																			</p>
																			<p class='text-sm text-gray-500 truncate'>
																				@{item.user.username}
																			</p>
																		</div>
																		<div>
																			<a
																				href={`/loanercal/3/${item.department.id}`}
																				class='inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50'
																			>
																				{' '}
																				View{' '}
																			</a>
																		</div>
																	</div>
																</li>
															))
														) : (
															<li class='py-0 flex'>
																<div class=' px-0 '>
																	<p class='text-sm font-medium  '>
																		No Reserved Item!
																	</p>
																</div>
															</li>
														)}
													</ul>
												</div>
											</div>
										</ListGroupItem>
									}
								</ListGroupItem>
							</ListGroup>
						</Card>
						<Card small className='mb-4'>
							<CardHeader className='border-bottom'>
								<h6 className='m-0 text-red-700'>
									Overdue Items
								</h6>
							</CardHeader>
							<ListGroup flush>
								<ListGroupItem className='p-2 px-2 pt-2'>
									{
										<ListGroupItem>
											<div>
												<div class='flow-root mt-6'>
													<ul
														role='list'
														class='-my-5 divide-y divide-gray-200'
													>
														{this.state.allOverDueItems.length != 0 ? (
															this.state.allOverDueItems.map((item) => (
																<li class='py-3'>
																	<div class='flex items-center space-x-4'>
																		<div class='flex-1 min-w-0'>
																			<p class='text-sm font-medium text-gray-900 truncate'>
																				{item.data.item.name}{' '}
																			</p>
																			<p class='text-sm text-gray-500 truncate'>
																				@{item.data.user.username}
																			</p>
																		</div>
																		<div>
																			<p class='text-sm font-medium  truncate'
																			   style = {{color: '#b91c1c'}}>
																				{item.days + ' day(s)'}{' '}
																			</p>
																		</div>
																	</div>
																</li>
															))
														) : (
															<li class='py-0 flex'>
																<div class=' px-0 '>
																	<p class='text-sm font-medium  '>
																		No Overdue items
																	</p>
																</div>
															</li>
														)}
													</ul>
												</div>
											</div>
										</ListGroupItem>
									}
								</ListGroupItem>
							</ListGroup>
						</Card>

						<Card small className='mb-4'>
							<CardHeader className='border-bottom'>
								<h6 className='m-0 text-gray-900'>
									Meet Staff Member
								</h6>
							</CardHeader>
							<ListGroup flush>
								<ListGroupItem className='p-0 px-2 pt-2'>
									{this.state.leadsMemember.length != 0 ? (
										<li class='py-4 flex'>
											<Link
												to={
													'/user-profile/' +
													this.state.leadsMemember[0].username
												}
												class='block hover:bg-gray-100'
											>
												<span class='inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500'>
													<span class='font-medium leading-none text-white'>
														{this.state.leadsMemember[0].firstName.charAt(0) +
															' ' +
															this.state.leadsMemember[0].lastName.charAt(
																0
															)}{' '}
													</span>
												</span>
											</Link>
											<div class='ml-3'>
												<Link
													to={
														'/user-profile/' +
														this.state.leadsMemember[0].username
													}
												>
													<p class='text-sm font-medium text-gray-900'>
														{this.state.leadsMemember[0].firstName +
															' ' +
															this.state.leadsMemember[0].lastName}
													</p>
													<p class='text-sm text-gray-500'>
														{this.state.leadsMemember[0].email}
													</p>
												</Link>
											</div>
										</li>
									) : (
										<li class='py-1 flex'>
											<div class=' px-0 pt-0 m-2'>
												<p class='text-sm font-medium  '>No info Available</p>
											</div>
										</li>
									)}
								</ListGroupItem>
							</ListGroup>
						</Card>
					</Col>
				</Row>
			</Container>
		);
	}
}

const mapStateToProps = (state) => {
	return { groups: state.auth.user.groups };
};

export default connect(mapStateToProps)(Home);
