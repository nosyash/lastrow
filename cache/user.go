package cache

// AddUser read information about user from Database and add the user to the user cache
func (u *Users) addUser(uuid string) {
	userProfile, _ := u.db.GetUserProfile(uuid)

	u.users[uuid] = &User{
		Name:  userProfile.Name,
		Color: userProfile.Color,
		Image: userProfile.Image,
		Guest: false,
		ID:    getHashOfString(uuid[:8]),
	}

	u.UpdateUsers <- struct{}{}
}

// AddGuest add guest user to the user cache
func (u *Users) addGuest(user *User) {
	u.users[user.UUID] = user
	u.UpdateUsers <- struct{}{}
}

// DelUser delete a user from the cache
func (u *Users) delUser(uuid string) {
	delete(u.users, uuid)
	u.UpdateUsers <- struct{}{}
}

// GetUser return user object by UUID
func (u Users) GetUser(uuid string) (*User, bool) {
	user, ok := u.users[uuid]
	return user, ok
}

// UpdateUser update user in cache, image, nickname, color etc.
func (u *Users) UpdateUser(uuid string) {
	userProfile, _ := u.db.GetUserProfile(uuid)
	user, _ := u.GetUser(uuid)

	user.Name = userProfile.Name
	user.Color = userProfile.Color
	user.Image = userProfile.Image
}

// UsersCount return count users for current room
func (u Users) UsersCount() int {
	return len(u.users)
}

// GetAllUsers return all users
func (u Users) GetAllUsers() []*User {
	var users []*User

	for _, user := range u.users {
		users = append(users, &User{
			Name:  user.Name,
			Color: user.Color,
			Image: user.Image,
			ID:    user.ID,
			Guest: user.Guest,
		})
	}

	return users
}
