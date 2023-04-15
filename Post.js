import bootbox from "bootbox";
import moment from "moment";
import React, {useState, useEffect} from 'react'
import { connect } from "react-redux";
import { Link, Redirect, withRouter } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import APIUser from "../../APIService/APIUser";
import APIPost from "../../APIService/APIPost";
import { LassoErrorMessages, LassoErrors } from "../../data/error_handler";
import { ErrorHandler } from "../../APIService/ErrorHandler";
import Button from "../../components/basic/buttons/Button";
import ButtonGroup from "../../components/basic/buttons/ButtonGroup";
import Container from "../../components/basic/Container";
import Row from "../../components/basic/Row";
import PermissionRender from "../../APIService/PermissionRender";

// import ReactHtmlParser from 'react-html-parser';
class Post extends React.Component {
  constructor(props) {
    super(props);
   
    const permissions = JSON.parse(sessionStorage.getItem("_permissions_"));

    this.state = {
      PostList: [],
      roles:
        permissions && permissions.roles && permissions.roles.length
          ? permissions.roles
          : [],
      adminPermissions: ["CanAdministerHome"],
      CurrentUser: this.props.user,
    };
    this.delete = this.delete.bind(this);
    this.lastUpdated = this.lastUpdated.bind(this);
    this.colorType = this.colorType.bind(this);
    this.expired = this.expired.bind(this);
    this.edit = this.edit.bind(this);
    this.userHasPermissionToManage = this.userHasPermissionToManage.bind(this);
  }

  colorType(priority) {
    if (priority === "Normal") {
      return "#007bff";
    } else if (priority === "Medium") {
      return "#007bff";
    } else if (priority === "High") {
      return "orange";
    }

    return "#b91c1c";
  }

  expired(dateformat) {
    const dueTime = Date.parse(dateformat);
    const now = Date.now();
    const diff = now - dueTime;

    return diff < 0;
  }
  edit(id) {
    APIPost.selectedPost(id).then((res) => {
      if (!ErrorHandler(res)) {
        //takes response and prints pops up error message and returns true if error exists

        this.props.history.push(`/edit-post/${id}`);
        // <Redirect to={`/edit-post/${id}`} />;
      }
    });
  }

  lastUpdated(lastUpdatedtime, posted) {
    var time = posted;
    if (lastUpdatedtime != null) {
      time = lastUpdatedtime;
    }

    var postedAT = new Date(time);
    var currentTime = Date.now();

    var diff = Math.abs(currentTime - postedAT);

    var ms = diff % 1000;
    diff = (diff - ms) / 1000;
    var ss = diff % 60;
    diff = (diff - ss) / 60;
    var mm = diff % 60;
    diff = (diff - mm) / 60;
    var hh = diff % 24;
    var days = (diff - hh) / 24;

    if (days > 0) {
      if (days > 30) {
        return Math.floor(days / 30) + " months";
      }
      return days + " Days";
    } else if (hh > 0) {
      return hh + " Hours";
    } else if (mm > 0) {
      return mm + " Minutes";
    } else {
      return "Just now";
    }

    // this.PostList[0].author.lastName;
  }

  delete(id) {
    const instance = this;
    bootbox.confirm("Are you sure you want to delete?", function (result) {
      if (result) {
        APIPost.deletePost(id).then((res) => {
          if (!ErrorHandler(res)) {
            //takes response and prints pops up error message and returns true if error exists

            // APIEmail.emaildeletedPost(res)
            bootbox.alert("Post deleted successfully!", function () {
              instance.props.history.push("/");
            });
          }
        });
      }
    });
  }

  userHasPermissionToManage(component, post) {
    var hasPermission = false;
    try {
      if (post.author.username === this.state.CurrentUser.username) {
        hasPermission = true;
      } else if (
        PermissionRender.userCanAdminister(
          true,
          this.state.roles,
          this.state.adminPermissions
        )
      ) {
        hasPermission = true;
      } else if (hasPermission === false) {
        this.state.CurrentUser.groups.map((group) => {
          if ((post.adminGroups ? post.adminGroups : []).includes(group))
            hasPermission = true;
        });
      } else {
        this.state.CurrentUser.groupIds.map((group) => {
          if ((post.adminGroupIds ? post.adminGroupIds : []).includes(group))
            hasPermission = true;
        });
      }
      return hasPermission ? component : hasPermission && component;
    } catch (error) {
      return false;
    }
  }

  

  render() {
    const PostList = this.props.PostList;
    
    return (
      <Row>
        {PostList.map((post) => (
       
          <Container
            key={post._id}
            fluid
            className="main-content-container px-0 m-0"
          >
            
            {/* THIS IS WHERRE MY STUFF STARTS */}
            <div className="card mb-5">
              <ul role="list" class="space-y-2">
                <li class="bg-white px-4 shadow C-p-2 sm:rounded-lg mt-0.5">
                  <article aria-labelledby="question-title-81614">
                    <div>
                      <div class="flex space-x-3">
                        <div class="flex-shrink-0">
                          <Link
                            to={"/user-profile/" +  post.author.username}
                            class="block hover:bg-gray-100"
                          >
                            {
                              post.author.picture? 
                              <img
							class="inline-flex items-center justify-center h-10 w-10 rounded-full "
								// src={profileImage ? profileImage : `'${require("../../../assets/avatars/" + "person-placeholder.png")}'`} // getting placeholder image from local storage
               // profileImage
								//		? profileImage
								//		: `url('https://lasso-profile-images.s3.amazonaws.com/person-placeholder.png')`
								src={
                  post.author.picture? 
                  "https://lasso-profile-images.s3.amazonaws.com/"+post.author.picture
                  :'https://lasso-profile-images.s3.amazonaws.com/person-placeholder.png'
								} // getting avatar from online website or server - should change it to local
								alt={'Profile Image ...'}
								width="50"
                height="50"
          
							/>
                              :
                              <span class="inline-flex items-center justify-center h-10 w-10 rounded-full " style={{backgroundImage: `url(https://lasso-profile-images.s3.amazonaws.com/person-placeholder.png)`,backgroundSize:"cover",backgroundPosition: 'center'}}>
                            </span>
                            


                            }
                                  
                          </Link>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-medium text-gray-900 hover:text-blue-800">
                            <Link to={"/user-profile/" + post.author.username}>
                              {post.author.firstName +
                                " " +
                                post.author.lastName}
                            </Link>
                          </p>
                          <p class="text-sm text-gray-500">
                            <a href="#" class="hover:underline hover:text-blue-800">
                              <time
                                datetime={moment(post.datePosted).format(
                                  "llll"
                                )}
                              >
                                {" "}
                                {moment(post.datePosted).format("llll")}
                              </time>
                            </a>
                          </p>
                        </div>
                        <div class="flex-shrink-0 self-center flex">
                          <div class="relative inline-block text-left">
                            <div>
                              <button
                                type="button"
                                class="-m-2 p-2 rounded-full flex items-center text-gray-400 hover:text-gray-600"
                                id="options-menu-0-button"
                                aria-expanded="false"
                                aria-haspopup="true"
                              >
                                <span class="sr-only">Open options</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
                                  role="img"
                                  width="1em"
                                  height="1em"
                                  preserveAspectRatio="xMidYMid meet"
                                  viewBox="0 0 16 16"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464l-.003.001l-.006.003l-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35c-.816.252-1.879.523-2.71.523c-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007l.004-.002h.001"
                                  />
                                </svg>
                                <div
                                  class="col-sm  "
                                  style={{
                                    color: this.colorType(post.priority),
                                  }}
                                >
                                  {post.priority}
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class='mt-1 Thin-Sepalator Thin-Sepalator2'>
                      <h2
                        id="question-title-81614"
                        class="mt-3 text-center font-medium text-base text-blue-800 no-underline mb-5"
                      >
                        {post.subject}
                      </h2>
                    
                    <div class="mt-2 text-sm text-gray-700 space-y-4 ">
                      <div class="card-text mr-5 ml-5"
                
                        dangerouslySetInnerHTML={{ __html: post.message }}
                      ></div>
                      </div>
                    </div>
                    </div>
                    <div class="flex justify-between space-x-8">
                      <div class="flex space-x-6">
                        <span class="inline-flex items-center text-sm">
                          <ReactTooltip />

                          <Button
                            theme=""
              
          
                            data-tip={
                              this.expired(post.expirationDate)
                                ? "This is a new post"
                                : "This post is expired"
                            }
                            data-type="dark"
                            data-place="bottom"
                            data-delay-show={200}
                          >
                            {this.expired(post.expirationDate) ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                role="img"
                                width="3em"
                                height="3em"
                                preserveAspectRatio="xMidYMid meet"
                                viewBox="0 0 36 36"
                              >
                                <path
                                  fill="currentColor"
                                  d="m34.11 24.49l-3.92-6.62l3.88-6.35a1 1 0 0 0-.85-1.52H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h31.25a1 1 0 0 0 .86-1.51Zm-23.6-3.31H9.39l-3.26-4.34v4.35H5V15h1.13l3.27 4.35V15h1.12ZM16.84 16h-3.53v1.49h3.2v1h-3.2v1.61h3.53v1h-4.66V15h4.65Zm8.29 5.16H24l-1.55-4.59l-1.55 4.61h-1.12l-2-6.18H19l1.32 4.43L21.84 15h1.22l1.46 4.43L25.85 15h1.23Z"
                                  class="clr-i-solid clr-i-solid-path-1"
                                />
                                <path fill="none" d="M0 0h36v36H0z" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                role="img"
                                width="2em"
                                height="2em"
                                preserveAspectRatio="xMidYMid meet"
                                viewBox="0 0 48 48"
                              >
                                <circle cx="17" cy="17" r="14" fill="#00ACC1" />
                                <circle cx="17" cy="17" r="11" fill="#eee" />
                                <path d="M16 8h2v9h-2z" />
                                <path d="m22.655 20.954l-1.697 1.697l-4.808-4.807l1.697-1.697z" />
                                <circle cx="17" cy="17" r="2" />
                                <circle cx="17" cy="17" r="1" fill="#00ACC1" />
                                <path
                                  fill="#FFC107"
                                  d="m11.9 42l14.4-24.1c.8-1.3 2.7-1.3 3.4 0L44.1 42c.8 1.3-.2 3-1.7 3H13.6c-1.5 0-2.5-1.7-1.7-3z"
                                />
                                <path
                                  fill="#263238"
                                  d="M26.4 39.9c0-.2 0-.4.1-.6s.2-.3.3-.5s.3-.2.5-.3s.4-.1.6-.1s.5 0 .7.1s.4.2.5.3s.2.3.3.5s.1.4.1.6s0 .4-.1.6s-.2.3-.3.5s-.3.2-.5.3s-.4.1-.7.1s-.5 0-.6-.1s-.4-.2-.5-.3s-.2-.3-.3-.5s-.1-.4-.1-.6zm2.8-3.1h-2.3l-.4-9.8h3l-.3 9.8z"
                                />
                              </svg>
                            )}
                          </Button>
                          <ReactTooltip />

                          {this.userHasPermissionToManage(
                            <ButtonGroup size="sm" className="d-table">
                              <ReactTooltip />

                              <Button
                                theme=""
                                className = "text-blue-800"
                                onClick={() => this.edit(post._id)}
                                data-tip="edit"
                                data-type="dark"
                                data-place="bottom"
                                data-delay-show={200}
                              >
                                <i className="material-icons ">&#xE254;</i>
                              </Button>
                              <ReactTooltip />

                              <ReactTooltip />
                              <Button
                                theme=""
                                className = "text-red-700"
                                onClick={() => this.delete(post._id)}
                                data-tip="delete"
                                data-type="dark"
                                data-place="bottom"
                                data-delay-show={200}
                              >
                                <i className="material-icons">&#xE872;</i>
                              </Button>
                              <ReactTooltip />
                            </ButtonGroup>,
                            post
                          )}
                        </span>
                      </div>
                      <div class="flex text-sm">
                        <span class="inline-flex items-center text-sm">
                          <button
                            type="button"
                            class="inline-flex space-x-2 text-gray-400 hover:text-gray-500"
                          >
                            <span class="text-gray-500 italic">
                              {"Last edit in " +
                                this.lastUpdated(
                                  post.dateUpdated,
                                  post.datePosted
                                )}
                            </span>
                          </button>
                        </span>
                      </div>
                    </div>
                  </article>
                </li>
              </ul>
            </div>
          </Container>
        ))}
      </Row>
    );
  }
}

const mapStateToProps = (state) => {
  return { user: state.auth.user };
};

export default withRouter(connect(mapStateToProps)(Post));
