package cache

func (u *Users) Add(uuid string) {

	userProfile, _ := u.db.GetUserProfile(uuid)

	u.users[uuid] = &User{
		Name:  userProfile.Name,
		Color: userProfile.Color,
		Image: userProfile.Image,
		Guest: false,
		ID:    getHashOfString(uuid[:8]),
	}
}

func (u *Users) _AddGuest(user *User) {
	u.users[user.UUID] = user
}

func (u *Users) delUser(uuid string) {
	delete(u.users, uuid)
}

func (u *Users) GetUser(uuid string) (*User, bool) {
	user, ok := u.users[uuid]
	return user, ok
}

func (u *Users) UpdateUser(uuid string) {

	userProfile, _ := u.db.GetUserProfile(uuid)
	user, _ := u.GetUser(uuid)

	user.Name = userProfile.Name
	user.Color = userProfile.Color
	user.Image = userProfile.Image
}

func (u *Users) UsersCount() int {
	return len(u.users)
}

func (u *Users) GetAllUsers() []*User {

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
